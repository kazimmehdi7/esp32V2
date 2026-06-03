'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import Canvas from '@/components/Canvas';
import CodePanel from '@/components/CodePanel';
import Header from '@/components/Header';
import PDFViewer from '@/components/PDFViewer';
import Sidebar from '@/components/Sidebar';
import SimulationOverlay from '@/components/SimulationOverlay';
import StaticCodePanel from '@/components/StaticCodePanel';
import { MAPPING_PANEL_REGISTRY } from '@/lib/mappingPanelRegistry';
import { BLOCK_CATALOGUE } from '@/lib/blockCatalogue';
import { LEVELS } from '@/lib/lessonConfig';
import { SIMULATION_REGISTRY } from '@/lib/simulationRegistry';
import { useAppStore } from '@/store/useAppStore';
import InteractiveLecture from '@/components/InteractiveLecture';
import { useActivityStore } from '@/store/useActivityStore';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ levelId: string; lessonId: string }>();
  const blocks = useAppStore((state) => state.blocks);
  const clearBlocks = useAppStore((state) => state.clearBlocks);

  const levelId = Number(params.levelId);
  const lessonId = params.lessonId;

  // Kit code activation check
  const { hasAccess, isCheckingSub, initialize } = useActivityStore();
  const hasEsp32 = hasAccess('esp32');
  const isFreePreview = levelId === 1 && lessonId === '1-1';

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    if (!isCheckingSub && !isFreePreview) {
      const isLessonLocked = !hasEsp32 && (levelId > 1 || lessonId !== '1-1');
      if (isLessonLocked) {
        alert('This lesson requires kit activation code! Redirecting to activation page...');
        router.push('/redeem');
      }
    }
  }, [isCheckingSub, hasEsp32, levelId, lessonId, isFreePreview, router]);

  const level = LEVELS.find((l) => l.id === levelId);
  const lesson = level?.lessons.find((l) => l.id === lessonId);

  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [challengeError, setChallengeError] = React.useState<string | null>(null);
  const [challengePassed, setChallengePassed] = React.useState(false);

  const totalSteps = lesson?.steps.length ?? 0;
  const currentStep = lesson?.steps[currentStepIndex];

  React.useEffect(() => {
    // Don't clear blocks on mapping step — student needs to see what they built
    if (currentStep?.type !== 'mapping') {
      clearBlocks();
    }
    setChallengeError(null);
    setChallengePassed(false);
  }, [clearBlocks, currentStepIndex, currentStep?.type]);

  if (isCheckingSub && !isFreePreview) {
    return (
      <main className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2E4862] border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Verifying kit activation...</p>
        </div>
      </main>
    );
  }

  if (!level || !lesson) {
    return (
      <main className="min-h-screen bg-[#EDEDED]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-[#2E4862]">Lesson not found</h1>
            <button
              type="button"
              onClick={() => router.push('/learn')}
              className="mt-3 text-sm text-gray-500 hover:text-[#2E4862]"
            >
              ← Back to Learning Path
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentStep) {
    return (
      <main className="min-h-screen bg-[#EDEDED]">
        <Header />
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-[#2E4862]">Lesson not found</h1>
            <button
              type="button"
              onClick={() => router.push('/learn')}
              className="mt-3 text-sm text-gray-500 hover:text-[#2E4862]"
            >
              ← Back to Learning Path
            </button>
          </div>
        </div>
      </main>
    );
  }

  const progressPercent = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const handlePrev = () => {
    if (currentStepIndex === 0) return;
    setCurrentStepIndex((prev) => prev - 1);
  };

  const validateChallenge = (): boolean => {
    if (!currentStep?.challengeBlocks) return true;

    const studentTypes = blocks.map((b) => b.type);
    const requiredTypes = currentStep.challengeBlocks;
    setChallengePassed(false);

    if (studentTypes.length === 0) {
      setChallengeError('Add some blocks to complete this challenge!');
      return false;
    }

    if (currentStep.challengeStrict) {
      // Order must match exactly
      const matches =
        studentTypes.length === requiredTypes.length &&
        requiredTypes.every((type, index) => studentTypes[index] === type);
      if (!matches) {
        setChallengeError(
          'Good start! Try reordering your blocks — check the hint for the right sequence.',
        );
        return false;
      }
    } else {
      // Just check all required types are present
      const missingBlocks = requiredTypes.filter((required) => {
        if (required === 'delay_ms') {
          return !studentTypes.includes('delay_ms') && !studentTypes.includes('delay_sec');
        }

        if (required === 'delay_sec') {
          return !studentTypes.includes('delay_ms') && !studentTypes.includes('delay_sec');
        }

        return !studentTypes.includes(required);
      });
      if (missingBlocks.length > 0) {
        const blockNames: Record<string, string> = {
          pinMode: 'Set Pin Mode',
          dw_high: 'Turn ON LED',
          dw_low: 'Turn OFF LED',
          delay_ms: 'Wait (ms)',
          delay_sec: 'Wait (seconds)',
          serial_begin: 'Start Serial',
          btn_read: 'Read Button',
          if_block: 'If condition',
          end_if: 'End If',
        };
        const missing = missingBlocks.map((b) => blockNames[b] || b).join(', ');
        setChallengeError(
          `Almost there! You still need: ${missing}. Check the hint for guidance.`,
        );
        return false;
      }
    }

    // Check pin values if specified
    if (currentStep.challengePinValues) {
      for (const [blockType, expectedPin] of Object.entries(currentStep.challengePinValues)) {
        const block = blocks.find((b) => b.type === blockType);
        if (block && Number(block.values.pin) !== expectedPin) {
          setChallengeError(
            `Check the pin number on your ${blockType} block — expected Pin ${expectedPin}`,
          );
          return false;
        }
      }
    }

    setChallengeError(null);
    setChallengePassed(true);
    return true;
  };

  const handleAdvance = () => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(currentStepIndex);
      return next;
    });

    if (currentStepIndex >= totalSteps - 1) {
      router.push('/learn');
      return;
    }

    setCurrentStepIndex((prev) => prev + 1);
  };

  const handleNext = () => {
    if (currentStep.type === 'challenge') {
      if (currentStep.challengeSimulationId) {
        handleAdvance();
        return;
      }
      if (!challengePassed) {
        const isValid = validateChallenge();
        if (!isValid) return;
        // Validation just passed — overlay will open, stay on this step
        return;
      }
      // challengePassed already true — advance
      handleAdvance();
      return;
    }
    handleAdvance();
  };

  const allowedBlocksFromStep = currentStep?.allowedBlocks;
  const allowedBlocks = allowedBlocksFromStep
    ? allowedBlocksFromStep.filter((type) => BLOCK_CATALOGUE.some((b) => b.type === type))
    : undefined;
  const SimulationComponent = currentStep?.simulationId
    ? SIMULATION_REGISTRY[currentStep.simulationId] ?? null
    : null;

  return (
    <main className="min-h-screen bg-[#EDEDED]">
      <Header />

      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col">
          <div className="border-b border-gray-100 p-5">
            <button
              type="button"
              onClick={() => router.push('/learn')}
              className="text-xs text-gray-500 hover:text-[#2E4862]"
            >
              ← Levels
            </button>

            <h2 className="mt-3 text-base font-bold text-[#2E4862]">{lesson.title}</h2>
            <p className="mt-1 text-xs text-gray-500">{lesson.description}</p>

            <div className="mt-3 h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-[#2E4862]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {currentStepIndex + 1} of {totalSteps} steps
            </p>
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            {lesson.steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = completedSteps.has(index);
              const isLocked = index > completedSteps.size;

              const icon = isCompleted ? '✅' : isActive ? '🔵' : isLocked ? '🔒' : '⚪';

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setCurrentStepIndex(index)}
                  className={`mx-3 mb-2 flex w-[calc(100%-24px)] items-center gap-2 rounded-lg px-3 py-2.5 text-left ${isActive
                      ? 'bg-[#2E4862] text-white cursor-pointer'
                      : isCompleted
                        ? 'bg-green-50 text-green-700 border border-green-100 cursor-pointer'
                        : isLocked
                          ? 'opacity-40 cursor-not-allowed text-gray-600'
                          : 'cursor-pointer text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <span>{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{step.title}</p>
                    <p className="mt-0.5 text-[10px] opacity-60 uppercase tracking-wide">{step.type}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex flex-1 flex-col overflow-hidden">
          {!currentStep.pdfUrl && (
            <div className="border-b border-gray-100 bg-white px-8 py-5">
              <h1 className="text-xl font-bold text-[#2E4862]">{currentStep.title}</h1>
              <p className="mt-0.5 text-sm text-gray-500">{currentStep.description}</p>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {(currentStep.type === 'content' || currentStep.type === 'concept') && (
              <div className="h-full px-8 py-6 overflow-y-auto">
                {currentStep.pdfUrl ? (
                  <PDFViewer url={currentStep.pdfUrl} title={currentStep.pdfLabel} />
                ) : (
                  <InteractiveLecture
                    levelId={levelId}
                    lessonId={lessonId}
                    stepId={currentStep.id}
                  />
                )}
              </div>
            )}

            {(currentStep.type === 'explore' || currentStep.type === 'challenge') && (
              <div className="h-full p-3">
                <div className="flex-shrink-0 px-4 pt-3 flex flex-col gap-2">
                  {currentStep.hint && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                      💡 Hint: {currentStep.hint}
                    </div>
                  )}
                  {currentStep.type === 'challenge' && challengeError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                      ❌ {challengeError}
                    </div>
                  )}
                  {currentStep.type === 'challenge' && challengePassed && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-xs text-green-700">
                      ✅ Great job! Your solution looks correct. Click Next to continue.
                    </div>
                  )}
                </div>

                {currentStep.type === 'explore' && currentStep.explorationSimulationId ? (
                  <div className="h-full overflow-y-auto px-2 py-1">
                    {(() => {
                      const ExploreComponent = SIMULATION_REGISTRY[
                        currentStep.explorationSimulationId
                      ] ?? null;
                      return ExploreComponent ? <ExploreComponent /> : null;
                    })()}
                  </div>
                ) : currentStep.type === 'challenge' && currentStep.challengeSimulationId ? (
                  <div className="h-full overflow-y-auto px-2 py-1">
                    {(() => {
                      const ChallengeSimComponent = SIMULATION_REGISTRY[
                        currentStep.challengeSimulationId
                      ] ?? null;
                      return ChallengeSimComponent ? <ChallengeSimComponent /> : null;
                    })()}
                  </div>
                ) : (
                  <div className="flex h-[calc(100%-0px)] overflow-hidden rounded-xl">
                    <div className="w-[240px] overflow-hidden rounded-xl bg-white shadow-sm flex-shrink-0">
                      <Sidebar allowedBlocks={allowedBlocks} />
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                      <Canvas showAIButton={false} />
                    </div>
                  </div>
                )}

                {currentStep.type === 'challenge' && SimulationComponent &&
                  !currentStep.challengeSimulationId && (
                    <SimulationOverlay
                      isOpen={challengePassed}
                      onContinue={handleAdvance}
                      blocks={blocks}
                      title="See what your code does on the hardware"
                    >
                      <SimulationComponent />
                    </SimulationOverlay>
                  )}
              </div>
            )}

            {currentStep.type === 'mapping' && (
              <div className="h-full p-4 flex flex-col">
                <p className="mb-3 text-sm text-gray-500 flex-shrink-0">
                  🔍 See how each block maps to real Arduino C++ code
                </p>
                <div className="flex flex-1 gap-3 overflow-hidden">
                  {/* Left — simulation, example program, or student blocks */}
                  <div className={`flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ${currentStep.mappingSimulationId ? 'flex-1' : 'w-[360px]'
                    }`}>
                    {currentStep.mappingSimulationId ? (
                      <div className="h-full overflow-y-auto p-3">
                        {(() => {
                          const MapSim = SIMULATION_REGISTRY[
                            currentStep.mappingSimulationId
                          ] ?? null;
                          return MapSim ? <MapSim /> : null;
                        })()}
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#2E4862] px-4 py-2.5 rounded-t-xl">
                          <p className="text-xs font-semibold text-white">
                            {lesson?.steps.find(s => s.type === 'challenge')?.challengeSimulationId
                              ? 'Example Program'
                              : 'Your Blocks'}
                          </p>
                        </div>
                        <div className="overflow-y-auto h-[calc(100%-40px)] pointer-events-none">
                          {lesson?.steps.find(s => s.type === 'challenge')?.challengeSimulationId ? (
                            <div className="p-4 flex flex-col gap-2">
                              <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">
                                This lesson used an interactive simulator instead of the block
                                canvas. Below is a representative program showing the concept.
                              </p>
                              {[
                                { icon: '📌', label: 'Set Pin 2 as OUTPUT', colour: 'bg-orange-500' },
                                { icon: '💡', label: 'Turn ON LED on Pin 2', colour: 'bg-orange-500' },
                                { icon: '⏱️', label: 'Wait 1000 ms', colour: 'bg-yellow-500' },
                                { icon: '🌑', label: 'Turn OFF LED on Pin 2', colour: 'bg-orange-500' },
                                { icon: '⏱️', label: 'Wait 1000 ms', colour: 'bg-yellow-500' },
                              ].map((block, i) => (
                                <div key={i} className={`${block.colour} text-white px-3 py-2.5
                                  rounded-xl text-xs font-semibold flex items-center gap-2`}>
                                  <span>{block.icon}</span>
                                  <span>{block.label}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Canvas showAIButton={false} />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center justify-center flex-shrink-0">
                    <div className="flex flex-col items-center gap-1 text-[#2E4862]">
                      <div className="w-8 h-0.5 bg-[#2E4862]" />
                      <span className="text-lg">→</span>
                      <p className="text-[10px] text-gray-400 text-center w-16">generates</p>
                    </div>
                  </div>

                  {/* Right — generated or hardcoded code */}
                  <div className={`overflow-hidden rounded-xl bg-white shadow-sm ${currentStep.mappingSimulationId ? 'w-[380px] flex-shrink-0' : 'flex-1'
                    }`}>
                    {(() => {
                      if (currentStep.mappingCodeComponent) {
                        const MappingPanel = MAPPING_PANEL_REGISTRY[
                          currentStep.mappingCodeComponent
                        ] ?? null;
                        if (MappingPanel) return <MappingPanel />;
                      }
                      if (lesson?.steps.find(s => s.type === 'challenge')
                        ?.challengeSimulationId) {
                        return <StaticCodePanel />;
                      }
                      return <CodePanel showLiveOutput={
                        currentStep?.showSerialOutput === true
                      } />;
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-8 py-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="text-sm text-gray-500 hover:text-[#2E4862] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <div className="flex items-center gap-2">
              {lesson.steps.map((_, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = completedSteps.has(index);

                return (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full ${isActive ? 'bg-[#2E4862]' : isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-[#2E4862] px-6 py-2 text-sm font-medium text-white"
            >
              {currentStepIndex === totalSteps - 1 ? 'Complete Lesson ✓' : 'Next →'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

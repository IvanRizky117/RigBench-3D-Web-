export type TabId = 'home' | 'lecture' | 'lab3d' | 'os-disk' | 'exam';

export type LiveBackgroundMode = 'pcb-flow' | 'cozy-desk';

export type AsyncUiState = 'idle' | 'loading' | 'empty' | 'error' | 'submitting' | 'success';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export type ClusterId =
  | 'cluster-1'
  | 'cluster-2'
  | 'cluster-3'
  | 'cluster-4'
  | 'cluster-5'
  | 'cluster-6'
  | 'cluster-7';

export type TheaterVisualType =
  | 'ipo-cycle'
  | 'mainboard-15-tour'
  | 'chipset-bridge'
  | 'back-panel-map'
  | 'ram-notch-evolution'
  | 'cpu-timeline'
  | 'psu-smps-flow'
  | 'hdd-mbr-gpt'
  | 'os-boot-pipeline'
  | 'troubleshooting-matrix'
  | 'electronics-bench'
  | 'eula-legal-shield'
  | 'crack-threat-vector';

export interface LectureSegment {
  id: string;
  title: string;
  durationSec: number;
  narration: string;
  highlightedKeywords: string[];
  visualType: TheaterVisualType;
  stageCaption: string;
  examTakeaway: string;
}

export interface CurriculumCluster {
  id: ClusterId;
  number: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  ttsWeight: string;
  summaryPoints: string[];
  segments: LectureSegment[];
  trapWarning: string;
}

export type BusDomain = 'northbridge' | 'southbridge' | 'power' | 'io' | 'front-panel';

export interface MainboardComponentSpec {
  id: string;
  pinNumber: string; // "#01" .. "#24" or "FP"
  name: string;
  shortName: string;
  category: 'mainboard' | 'back-panel' | 'c-panel';
  busDomain: BusDomain;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  functionEssay: string;
  examTrap: string;
  keySpecs: string[];
  pinoutDetails?: Array<{
    pin: string;
    label: string;
    color: string;
    purpose: string;
  }>;
}

export interface AssemblyStep {
  stepNumber: number;
  id: string;
  title: string;
  targetComponentId: string;
  instruction: string;
  caution: string;
  verificationText: string;
}

export type ModelSourceMode = 'procedural' | 'public-glb' | 'local-glb';

export type Lab3DMode = 'inspect' | 'assemble';

export interface CpuMilestone {
  year: number;
  vendor: 'Intel' | 'AMD';
  model: string;
  note: string;
}

export interface RamGenerationSpec {
  id: string;
  name: string;
  pins: number;
  notches: string;
  notchOffsetPercent: number;
  secondNotchPercent?: number;
  speeds: string;
  maxCapacity: string;
  moduleType: 'SIMM' | 'DIMM' | 'RIMM';
  note: string;
}

export interface AtxPinSpec {
  pin: number;
  signal: string;
  voltage: string;
  colorName: string;
  colorHex: string;
  role: string;
  isPsOn?: boolean;
  isGround?: boolean;
  isStandby?: boolean;
}

export interface TroubleshootingCase {
  id: string;
  number: number;
  title: string;
  shortLabel: string;
  symptoms: string[];
  causes: string[];
  steps: Array<{
    area: string;
    actions: string[];
  }>;
  essayKeyTip: string;
}

export interface EulaClause {
  id: string;
  number: number;
  title: string;
  mechanism: string;
  risk: string;
  mitigation: string;
}

export interface CrackToolSpec {
  id: string;
  name: string;
  mechanism: string;
  characteristic: string;
  securityDanger: string;
}

export interface PiracyPillar {
  id: string;
  number: number;
  title: string;
  summary: string;
  details: string[];
}

export interface RubricCriterion {
  id: string;
  label: string;
  weight: number;
  /** Each group is a concept: matching ANY synonym phrase in at least `minHits` groups satisfies the criterion */
  conceptGroups: string[][];
  minGroupHits: number;
}

export interface EssayQuestion {
  id: string;
  type: 'essay';
  clusterId: ClusterId;
  topicTag: string;
  prompt: string;
  caseContext?: string;
  rubric: RubricCriterion[];
  idealAnswer: string;
  examTip: string;
}

export interface AbcOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface AbcQuestion {
  id: string;
  type: 'abc';
  clusterId: ClusterId;
  topicTag: string;
  prompt: string;
  options: AbcOption[];
  correctKey: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export type ExamQuestion = EssayQuestion | AbcQuestion;

export interface RubricCriterionResult {
  criterionId: string;
  label: string;
  weight: number;
  earnedWeight: number;
  matched: boolean;
  matchedTerms: string[];
}

export interface EssayEvaluationResult {
  questionId: string;
  scorePercent: number; // 0..100
  earnedPoints: number;
  maxPoints: number;
  criteriaResults: RubricCriterionResult[];
}

export interface AbcEvaluationResult {
  questionId: string;
  selectedKey: 'A' | 'B' | 'C' | 'D' | null;
  correctKey: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export interface ExamAttemptSummary {
  id: string;
  completedAtIso: string;
  durationMinutes: number;
  elapsedSeconds: number;
  totalScore: number; // 0..100 weighted (Essay 70% + ABC 30%)
  essayScorePercent: number;
  abcScorePercent: number;
  abcCorrectCount: number;
  abcTotalCount: number;
  essayEvaluations: EssayEvaluationResult[];
  abcEvaluations: AbcEvaluationResult[];
}

export interface GlossaryItem {
  id: string;
  term: string;
  category:
    | 'Hardware & Chipset'
    | 'Memori & Storage'
    | 'Kelistrikan'
    | 'Partisi & File System'
    | 'EULA & Keamanan Siber';
  definition: string;
  examTrap?: string;
}

export interface DiskPartition {
  id: string;
  label: string;
  driveLetter?: string;
  sizeGb: number;
  fileSystem: 'FAT32' | 'NTFS' | 'Unallocated' | 'RAW';
  status: 'Healthy (EFI System Partition)' | 'Healthy (Boot, Page File, Primary)' | 'Healthy (Primary Partition)' | 'Healthy (Recovery Partition)' | 'Unallocated';
  isProtected?: boolean;
  colorType: 'efi' | 'primary' | 'recovery' | 'unallocated';
}

export type AssemblyDifficulty = 'practice' | 'exam' | 'freeroam';

export type HddJumperMode = 'master' | 'slave' | 'cs';

export type CPanelWireId = 'hdd-led' | 'p-led-pos' | 'p-led-neg' | 'reset-sw' | 'power-sw';

export type FPanelZoneId =
  | 'fpanel-orange-13'
  | 'fpanel-green-2'
  | 'fpanel-green-4'
  | 'fpanel-blue-57'
  | 'fpanel-red-68'
  | 'fpanel-black-9';

export interface FPanelWireAssignment {
  zoneId: FPanelZoneId;
  polarityValid: boolean;
}

export type AssemblyStepId =
  | 'open-cpu-lever'
  | 'install-cpu'
  | 'close-cpu-lever'
  | 'apply-thermal-paste'
  | 'install-heatsink'
  | 'lock-heatsink-pins'
  | 'install-ram-1'
  | 'install-ram-2'
  | 'install-cmos'
  | 'install-vga'
  | 'lock-vga-screw'
  | 'install-hdd-jumper'
  | 'install-hdd-unit'
  | 'install-ide-cable'
  | 'install-hdd-molex'
  | 'wire-hdd-led'
  | 'wire-pled-pos'
  | 'wire-pled-neg'
  | 'wire-reset-sw'
  | 'wire-power-sw'
  | 'install-atx-24pin'
  | 'install-atx-4pin';

export interface AssemblyInventoryItem {
  id: AssemblyStepId;
  stepOrder: number;
  label: string;
  shortLabel: string;
  category: 'cpu' | 'memory-expansion' | 'storage' | 'c-panel' | 'power';
  targetSocketId: string;
  secondarySocketId?: string;
  targetSocketLabel: string;
  rulePrompt: string;
  wrongOrderHint: string;
  wrongSocketHint: string;
  successNote: string;
  requiresRotation?: boolean;
  requiresPolarity?: boolean;
  wireColorHex?: string;
}

export interface AssemblyReport {
  id: string;
  completedAtIso: string;
  difficulty: AssemblyDifficulty;
  elapsedSeconds: number;
  mistakes: number;
  totalSteps: number;
  accuracyPercent: number;
  hddJumperSelected: HddJumperMode;
  postPassed?: boolean;
  diagnosticIssues?: string[];
}

export interface UserProgressStore {
  completedClusters: ClusterId[];
  inspectedComponents: string[];
  assemblyCompleted: boolean;
  osSimCompleted: boolean;
  diskSimCompleted: boolean;
  masteredGlossaryIds: string[];
  examHistory: ExamAttemptSummary[];
  assemblyHistory: AssemblyReport[];
  liveBgMode: LiveBackgroundMode;
}


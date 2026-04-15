export type Gender = 'male' | 'female';
export type PaddlingSide = 'left' | 'right';

export interface FitnessMetrics {
    name: string;
    gender: Gender;
    paddlingSide: PaddlingSide;
    bodyWeight: number | null;

    // Mobility/Stability (Pass/Fail)
    mobilityHipFlexion: 'Pass' | 'Fail' | 'Bonus' | null;
    stabilityRotatorCuff: 'Pass' | 'Fail' | 'Bonus' | null;

    // Strength Tests
    deadlift: {
        weight: number;
        reps: number;
        tempo?: string; // 40X1
        isBonus: boolean;
    } | null;
    hangCleans?: {
        weight: number;
        reps: number | null;
    } | null;

    // Scored Tests (0-4 pts)
    core: {
        level: number; // 1, 2, 3, 4
        exercise: string;
        reps?: number | null;
        holdTime?: number | null;
    } | null;
    pullups: {
        pts: number;
        reps?: number | null;
        holdTime?: number | null;
        type: 'pull-up' | 'chin-up' | 'chin-up hold';
    } | null;
    benchPress: {
        pts: number;
        lbs: number;
        time: number | null; // seconds
    } | null;
    hsr: {
        pts: number;
        reps: number | null;
    } | null;
    pushupsDips: {
        pts: number;
        reps: number | null;
        type: 'push-up' | 'dip';
    } | null;
    cardio: {
        pts: number;
        value: number | string; // meters for run or time for erg
        type: 'run' | 'erg';
        details?: string;
    } | null;

    totalPts: number;
}

// Standards constants for scoring logic
export const STANDARDS = {
    // ... We can implement the full lookup tables here to automate scoring
};

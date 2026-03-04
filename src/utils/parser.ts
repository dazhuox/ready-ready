import { FitnessMetrics, Gender } from '../data/types';

export const parseRawFitnessData = (rawText: string, name: string = "Unknown Paddler"): FitnessMetrics => {
    const getMatch = (regex: RegExp, text: string) => {
        const match = text.match(regex);
        return match ? match[1] : null;
    };

    // 1. Basic Info & Gender Detection
    const genderMatch = rawText.match(/♂|boy|man|male/i) ? 'male' : 'female';
    const bodyWeight = getMatch(/BW:\s*([\d.]+)/, rawText);

    // 2. Mobility / Stability
    const mobility = rawText.includes('Hip Flexion: Bonus') ? 'Bonus' : rawText.includes('Hip Flexion: Pass') ? 'Pass' : 'Fail';
    const stability = rawText.includes('One-arm hangs: Bonus') || rawText.includes('Scapular Shrugs: Bonus') ? 'Bonus' : 'Pass';

    // 3. Deadlift & Cleans
    const dlWeight = getMatch(/Deadlift\s*Weight\s*:\s*([\d.]+)/i, rawText);
    const cleansWeight = getMatch(/Hang\s*Cleans\s*Weight\s*:\s*([\d.]+)/i, rawText);

    // 4. Core Level (detected by keywords)
    let coreLevel = 0;
    if (rawText.includes('Standing Ab Wheel')) coreLevel = 4;
    else if (rawText.includes('Superman on Rings')) coreLevel = 3;
    else if (rawText.includes('Kneeling Ab Wheel')) coreLevel = 2;
    else if (rawText.includes('Plank')) coreLevel = 1;

    const corePtsStr = getMatch(/Core:\s*([\d.]+)\s*pts/i, rawText);
    const coreReps = getMatch(/Ab\s*Wheel\s*([\d.]+)\s*reps/i, rawText) || getMatch(/reps:\s*([\d.]+)/i, rawText);

    // 5. Pull-ups / Chin-up Hold
    const pullupPtsStr = getMatch(/Pull-ups:\s*([\d.]+)\s*pts/i, rawText);
    const pullupReps = getMatch(/(\d+)\s*reps/i, rawText.split('Pull-ups:')[1] || "");
    const pullupHold = getMatch(/(\d+)\s*s\s*hold/i, rawText.split('Pull-ups:')[1] || "");

    // 6. Bench Press
    const benchPtsStr = getMatch(/Bench\s*Press:\s*([\d.]+)\s*pts/i, rawText);
    const benchLbs = getMatch(/(\d+)\s*lbs/i, rawText.split('Bench Press:')[1] || "");
    const benchTime = getMatch(/in\s*~(\d+)\s*s/i, rawText.split('Bench Press:')[1] || "");

    // 7. HSR (Head Supported Row)
    const hsrPtsStr = getMatch(/HSR:\s*([\d.]+)\s*pts/i, rawText);
    const hsrReps = getMatch(/(\d+)\s*reps/i, rawText.split('HSR:')[1] || "");

    // 8. Push-ups / Dips
    const pdPtsStr = getMatch(/Dips:\s*([\d.]+)\s*pts/i, rawText) || getMatch(/Push-ups:\s*([\d.]+)\s*pts/i, rawText);
    const pdReps = getMatch(/(\d+)\s*reps/i, rawText.split('Dips:')[1] || "") || getMatch(/(\d+)\s*reps/i, rawText.split('Push-ups:')[1] || "");

    // 9. Cardio (Run / Erg)
    const cardioPtsStr = getMatch(/Cardio:\s*([\d.]+)\s*pts/i, rawText);
    const cardioVal = getMatch(/=\s*([\d.]+)\s*km/i, rawText) || getMatch(/(\d+)\s*m/i, rawText) || getMatch(/(\d+:\d+)/, rawText);

    // 10. Total
    const totalPtsStr = getMatch(/Total:\s*([\d.]+)/i, rawText);

    return {
        name,
        gender: genderMatch,
        bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
        mobilityHipFlexion: mobility as any,
        stabilityRotatorCuff: stability as any,
        deadlift: {
            weight: dlWeight ? parseFloat(dlWeight) : 0,
            reps: 5, // Standard is 5 reps
            tempo: '40X1',
            isBonus: cleansWeight !== null
        },
        hangCleans: cleansWeight ? { weight: parseFloat(cleansWeight), reps: 3 } : undefined,
        core: {
            level: coreLevel,
            exercise: coreLevel === 2 ? 'Kneeling Ab Wheel' : coreLevel === 4 ? 'Standing Ab Wheel' : 'Other',
            reps: coreReps ? parseInt(coreReps) : undefined
        },
        pullups: {
            pts: pullupPtsStr ? parseFloat(pullupPtsStr) : 0,
            reps: pullupReps ? parseInt(pullupReps) : undefined,
            holdTime: pullupHold ? parseInt(pullupHold) : undefined,
            type: pullupHold ? 'chin-up hold' : 'pull-up'
        },
        benchPress: {
            pts: benchPtsStr ? parseFloat(benchPtsStr) : 0,
            lbs: benchLbs ? parseFloat(benchLbs) : 0,
            time: benchTime ? parseFloat(benchTime) : 0
        },
        hsr: {
            pts: hsrPtsStr ? parseFloat(hsrPtsStr) : 0,
            reps: hsrReps ? parseInt(hsrReps) : 0
        },
        pushupsDips: {
            pts: pdPtsStr ? parseFloat(pdPtsStr) : 0,
            reps: pdReps ? parseInt(pdReps) : 0,
            type: rawText.includes('Dips:') ? 'dip' : 'push-up'
        },
        cardio: {
            pts: cardioPtsStr ? parseFloat(cardioPtsStr) : 0,
            value: cardioVal ? (typeof cardioVal === 'string' && cardioVal.includes(':') ? 0 : parseFloat(cardioVal)) : 0,
            type: rawText.includes('km') || rawText.includes('m') ? 'run' : 'erg'
        },
        totalPts: totalPtsStr ? parseFloat(totalPtsStr) : 0
    };
};

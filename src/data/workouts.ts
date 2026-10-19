export type Place = 'cab' | 'outside' | 'gym';
export type Gear = 'none' | 'bands' | 'dumbbells';

export type Move = {
  name: string;
  how: string;
  seconds: number;
};

export type Workout = {
  id: string;
  name: string;
  place: Place;
  // Gear the workout needs. 'gym' workouts use the gym's own equipment.
  gear: Gear | 'gym';
  // Goals this workout helps most with, used to pick the next workout on Today.
  goals: string[];
  moves: Move[];
};

export const placeLabels: Record<Place, string> = {
  cab: 'In the cab',
  outside: 'Outside',
  gym: 'At a gym',
};

const gearLabels: Record<Workout['gear'], string> = {
  none: 'no gear',
  bands: 'bands',
  dumbbells: 'dumbbells',
  gym: 'machines',
};

export const workouts: Workout[] = [
  {
    id: 'seated-back-release',
    name: 'Seated back release',
    place: 'cab',
    gear: 'none',
    goals: ['Less back pain'],
    moves: [
      { name: 'Shoulder rolls', how: 'Sit tall and roll both shoulders back slowly, ten times.', seconds: 45 },
      { name: 'Seated twist', how: 'Hand on the opposite knee, turn your chest toward the window. Hold, then switch sides.', seconds: 90 },
      { name: 'Knee to chest', how: 'Pull one knee up and hug it. Breathe slowly, then switch legs.', seconds: 90 },
      { name: 'Figure four', how: 'Ankle over the other knee, lean forward a little. Hold, then switch sides.', seconds: 90 },
      { name: 'Seated cat and cow', how: 'Hands on knees. Round your back, then arch it. Move with your breath.', seconds: 60 },
      { name: 'Overhead reach', how: 'Lace your fingers and press up toward the roof. Lean left, then right.', seconds: 60 },
    ],
  },
  {
    id: 'neck-shoulder-reset',
    name: 'Neck and shoulder reset',
    place: 'cab',
    gear: 'none',
    goals: ['Less back pain', 'More energy'],
    moves: [
      { name: 'Chin tucks', how: 'Pull your chin straight back, like making a double chin. Hold 3 seconds, repeat.', seconds: 45 },
      { name: 'Ear to shoulder', how: 'Tip one ear toward your shoulder. Hold, then switch sides.', seconds: 60 },
      { name: 'Shoulder blade squeeze', how: 'Squeeze your shoulder blades together and down. Hold 5 seconds, repeat.', seconds: 60 },
      { name: 'Chest opener', how: 'Hands behind your head, elbows wide. Open your chest and breathe.', seconds: 45 },
      { name: 'Wrist and hand stretch', how: 'Arm straight, gently pull your fingers back. Switch hands.', seconds: 60 },
    ],
  },
  {
    id: 'hip-openers',
    name: 'Hip openers after a long haul',
    place: 'cab',
    gear: 'none',
    goals: ['Less back pain', 'Sleep better'],
    moves: [
      { name: 'Seated march', how: 'Lift one knee, then the other, at an easy pace.', seconds: 60 },
      { name: 'Figure four', how: 'Ankle over the other knee, lean forward a little. Hold, then switch sides.', seconds: 120 },
      { name: 'Ankle circles', how: 'Lift one foot and draw slow circles each way. Switch feet.', seconds: 60 },
      { name: 'Seated hamstring stretch', how: 'Slide to the seat edge, one leg straight, heel down. Lean forward. Switch legs.', seconds: 120 },
      { name: 'Slow breathing', how: 'Breathe in for 4, out for 6. Let your hips and shoulders drop.', seconds: 120 },
    ],
  },
  {
    id: 'band-upper-body',
    name: 'Band upper body',
    place: 'cab',
    gear: 'bands',
    goals: ['Lose weight', 'More energy'],
    moves: [
      { name: 'Band pull-aparts', how: 'Hold the band at chest height and pull it apart, squeezing your shoulder blades.', seconds: 60 },
      { name: 'Seated rows', how: 'Loop the band around your feet and pull your elbows back.', seconds: 60 },
      { name: 'Overhead press', how: 'Sit on the band and press your hands up overhead.', seconds: 60 },
      { name: 'Bicep curls', how: 'Stand on the band or sit on it, and curl your hands up.', seconds: 60 },
      { name: 'Rest', how: 'Shake out your arms and breathe.', seconds: 30 },
      { name: 'Band pull-aparts', how: 'Same as before. Slow and controlled.', seconds: 60 },
      { name: 'Seated rows', how: 'Same as before. Pause when your elbows are back.', seconds: 60 },
    ],
  },
  {
    id: 'dumbbell-quick-strength',
    name: 'Quick dumbbell strength',
    place: 'outside',
    gear: 'dumbbells',
    goals: ['Lose weight', 'More energy'],
    moves: [
      { name: 'Goblet squats', how: 'Hold one dumbbell at your chest, sit back and stand up.', seconds: 60 },
      { name: 'One-arm rows', how: 'Hand on the step or bumper, pull the dumbbell to your hip. Switch arms halfway.', seconds: 90 },
      { name: 'Shoulder press', how: 'Press both dumbbells overhead, then lower slowly.', seconds: 60 },
      { name: 'Rest', how: 'Walk around the truck once.', seconds: 60 },
      { name: 'Goblet squats', how: 'Same as before.', seconds: 60 },
      { name: 'Farmer carry', how: 'Hold the dumbbells at your sides and walk tall.', seconds: 90 },
    ],
  },
  {
    id: 'break-time-full-body',
    name: 'Break-time full body',
    place: 'outside',
    gear: 'none',
    goals: ['Lose weight', 'More energy'],
    moves: [
      { name: 'Brisk walk', how: 'Walk around your truck or the lot to warm up.', seconds: 120 },
      { name: 'Step-ups', how: 'Use the bottom step of the cab. Hold the grab bar. Switch legs halfway.', seconds: 120 },
      { name: 'Incline push-ups', how: 'Hands on the bumper or a step, body straight, lower and push up.', seconds: 90 },
      { name: 'Squats', how: 'Feet shoulder width, sit back like into a chair, stand up.', seconds: 90 },
      { name: 'Calf raises', how: 'Hold the truck for balance, rise onto your toes and lower slowly.', seconds: 90 },
      { name: 'Cool-down stretch', how: 'Hands on the trailer, step one foot back and stretch your calf. Switch.', seconds: 120 },
    ],
  },
  {
    id: 'walk-the-lot',
    name: 'Walk the lot',
    place: 'outside',
    gear: 'none',
    goals: ['Lose weight', 'Sleep better'],
    moves: [
      { name: 'Easy walk', how: 'Start slow and look around. Stay clear of moving trucks.', seconds: 300 },
      { name: 'Brisk walk', how: 'Pick up the pace so talking takes a little effort.', seconds: 600 },
      { name: 'Easy walk', how: 'Slow back down and let your breathing settle.', seconds: 300 },
    ],
  },
  {
    id: 'day-pass-strength',
    name: 'Day pass strength',
    place: 'gym',
    gear: 'gym',
    goals: ['Lose weight', 'More energy'],
    moves: [
      { name: 'Warm-up on a bike or treadmill', how: 'Easy pace until you feel warm.', seconds: 300 },
      { name: 'Leg press', how: 'Pick a weight you can do 10 to 12 times with good form. Three sets.', seconds: 360 },
      { name: 'Lat pulldown', how: 'Pull the bar to your upper chest. Three sets of 10 to 12.', seconds: 360 },
      { name: 'Chest press machine', how: 'Press out, lower slowly. Three sets of 10 to 12.', seconds: 360 },
      { name: 'Stretch', how: 'Calves, hamstrings, chest and hips. Take your time.', seconds: 300 },
    ],
  },
  {
    id: 'treadmill-and-stretch',
    name: 'Treadmill and stretch',
    place: 'gym',
    gear: 'gym',
    goals: ['Lose weight', 'Sleep better'],
    moves: [
      { name: 'Easy walk', how: 'Treadmill at an easy pace.', seconds: 300 },
      { name: 'Incline walk', how: 'Raise the incline until it feels like a steady hill.', seconds: 600 },
      { name: 'Easy walk', how: 'Incline back down, slow pace.', seconds: 180 },
      { name: 'Full stretch', how: 'Calves, hamstrings, hips, chest and back.', seconds: 420 },
    ],
  },
];

export function workoutMinutes(workout: Workout): number {
  const seconds = workout.moves.reduce((total, move) => total + move.seconds, 0);
  return Math.max(1, Math.round(seconds / 60));
}

export function workoutSummary(workout: Workout): string {
  return `${placeLabels[workout.place]} · ${gearLabels[workout.gear]}`;
}

export function findWorkout(id: string): Workout | undefined {
  return workouts.find((workout) => workout.id === id);
}

// Picks a cab workout the driver can do with their gear, preferring one that
// matches their goals and that they haven't done today.
export function pickNextWorkout(gear: Gear, goals: string[], doneToday: string[]): Workout {
  const usable = workouts.filter(
    (workout) => workout.place === 'cab' && (workout.gear === 'none' || workout.gear === gear),
  );
  const fresh = usable.filter((workout) => !doneToday.includes(workout.id));
  const pool = fresh.length > 0 ? fresh : usable;
  const matching = pool.find((workout) => workout.goals.some((goal) => goals.includes(goal)));
  return matching ?? pool[0];
}

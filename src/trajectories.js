/* Pre-targeted joint-angle trajectories for the hero fleet.

   Each robot loops through keyframes of joint DELTAS (radians) added to its
   baked layout pose (src/layout.js). Joints a keyframe omits stay at that
   pose. Between keys the joint values follow a periodic Catmull-Rom spline, so
   the motion is smooth and loops without a seam. `phase` offsets the clock so
   the fleet never moves in lock-step. URDF-loader clamps to joint limits. */

const trot = (a, b) => ({
  FR_thigh_joint: a, FL_thigh_joint: b, RR_thigh_joint: b, RL_thigh_joint: a,
});

/* G1 wave pose, as deltas over the layout rest pose (arm down, elbow slightly bent) */
const raise = { right_shoulder_pitch_joint: -2.0 };
const waveHi = { right_shoulder_roll_joint: -0.55, right_elbow_joint: 0.4, right_wrist_roll_joint: 0.4 };
const waveLo = { right_shoulder_roll_joint: -0.2, right_elbow_joint: -0.2, right_wrist_roll_joint: -0.4 };

export const TRAJ = {
  /* G1: a greeting. Arm lifts overhead, waves three times (shoulder roll +
     elbow + wrist in phase), lowers; body sways with it, left arm counters. */
  g1: {
    period: 10, phase: 0,
    keys: [
      { t: 0,    d: {} },
      { t: 1.2,  d: { ...raise, ...waveHi, waist_yaw_joint: -0.12, left_shoulder_pitch_joint: -0.1 } },
      { t: 1.9,  d: { ...raise, ...waveLo, waist_yaw_joint: -0.12 } },
      { t: 2.6,  d: { ...raise, ...waveHi, waist_yaw_joint: -0.1 } },
      { t: 3.3,  d: { ...raise, ...waveLo, waist_yaw_joint: -0.1 } },
      { t: 4.0,  d: { ...raise, ...waveHi, waist_yaw_joint: -0.08 } },
      { t: 4.7,  d: { ...raise, ...waveLo, waist_yaw_joint: -0.05 } },
      { t: 5.8,  d: { waist_yaw_joint: 0.05 } },
      { t: 7.5,  d: { waist_roll_joint: 0.06, left_shoulder_pitch_joint: -0.15, right_shoulder_pitch_joint: 0.1 } },
      { t: 8.8,  d: { waist_roll_joint: -0.04 } },
    ],
  },

  /* K1: look around, wave, lean */
  k1: {
    period: 8, phase: 2.2,
    keys: [
      { t: 0, d: {} },
      { t: 1.5, d: { AAHead_yaw: 0.55, Head_pitch: 0.12, Left_Elbow_Pitch: 0.5 } },
      { t: 3, d: { AAHead_yaw: -0.5, Head_pitch: -0.1, ARight_Shoulder_Pitch: -0.5, Right_Elbow_Pitch: 0.4 } },
      { t: 4.5, d: { AAHead_yaw: -0.25, Head_pitch: 0.2, Left_Shoulder_Roll: 0.4, Left_Elbow_Pitch: -0.5 } },
      { t: 6.5, d: { AAHead_yaw: 0.3, ARight_Shoulder_Pitch: 0.4, Right_Elbow_Pitch: -0.2 } },
    ],
  },

  /* Go2: breathing crouch, then a diagonal trot-in-place */
  go2: {
    period: 6, phase: 0.5,
    keys: [
      { t: 0,   d: {} },
      { t: 1,   d: { FR_thigh_joint: 0.12, FL_thigh_joint: 0.12, RR_thigh_joint: 0.12, RL_thigh_joint: 0.12, FR_calf_joint: -0.2, FL_calf_joint: -0.2, RR_calf_joint: -0.2, RL_calf_joint: -0.2 } },
      { t: 2,   d: { ...trot(-0.3, 0), FR_calf_joint: -0.5, RL_calf_joint: -0.5 } },
      { t: 2.5, d: {} },
      { t: 3,   d: { ...trot(0, -0.3), FL_calf_joint: -0.5, RR_calf_joint: -0.5 } },
      { t: 3.5, d: {} },
      { t: 4,   d: { ...trot(-0.3, 0), FR_calf_joint: -0.5, RL_calf_joint: -0.5 } },
      { t: 4.5, d: {} },
      { t: 5,   d: { ...trot(0, -0.3), FL_calf_joint: -0.5, RR_calf_joint: -0.5 } },
      { t: 5.5, d: {} },
    ],
  },

  /* Spot: arm reaches out to targets, gripper opens, body dips */
  spot: {
    period: 10, phase: 1,
    keys: [
      { t: 0,  d: {} },
      { t: 2,  d: { arm_joint1: -0.9, arm_joint2: -0.5, arm_joint3: -0.6, arm_gripper: 0.9 } },
      { t: 3.5, d: { arm_joint1: -0.9, arm_joint2: -0.5, arm_joint3: -0.6, arm_gripper: -0.2 } },
      { t: 5.5, d: { arm_joint1: 0.5, arm_joint2: 0.4, arm_joint5: 0.5, front_left_hip_y: -0.15, front_right_hip_y: -0.15, front_left_knee: 0.25, front_right_knee: 0.25 } },
      { t: 7.5, d: { arm_joint1: 0.2, arm_joint2: -0.2, arm_joint5: -0.4, rear_left_hip_y: -0.1, rear_right_hip_y: -0.1, rear_left_knee: 0.2, rear_right_knee: 0.2 } },
    ],
  },

  /* Microduck: weight shift with head turns and a jaw flap */
  microduck: {
    period: 6, phase: 0,
    keys: [
      { t: 0,   d: {} },
      { t: 1.5, d: { head_yaw: 0.6, head_pitch: 0.2, left_hip_roll: 0.18, right_hip_roll: 0.18, jaw: 0.4 } },
      { t: 3,   d: { head_yaw: -0.6, head_pitch: -0.1, left_hip_roll: -0.18, right_hip_roll: -0.18, jaw: 0 } },
      { t: 4.5, d: { head_yaw: 0, head_pitch: 0.3, head_roll: 0.3, jaw: 0.4 } },
    ],
  },

  /* Open Duck Mini: step-in-place with head look and antenna wiggle */
  openduck: {
    period: 5, phase: 1.3,
    keys: [
      { t: 0,    d: {} },
      { t: 0.8,  d: { left_hip_pitch: -0.3, left_knee: 0.5, left_ankle: -0.25, head_yaw: 0.5, left_antenna: 0.5, right_antenna: -0.5 } },
      { t: 1.6,  d: {} },
      { t: 2.5,  d: { right_hip_pitch: 0.3, right_knee: -0.5, right_ankle: 0.25, head_yaw: -0.5, left_antenna: -0.5, right_antenna: 0.5 } },
      { t: 3.4,  d: { head_pitch: 0.3, left_antenna: 0.4, right_antenna: 0.4 } },
      { t: 4.2,  d: {} },
    ],
  },

  /* Nova Carter: gentle rock on its drive wheels with caster swing */
  'nova-carter': {
    period: 7, phase: 0.8,
    keys: [
      { t: 0,   d: {} },
      { t: 1.75, d: { joint_wheel_left: 0.8, joint_wheel_right: 0.8, joint_swing_left: 0.15, joint_swing_right: 0.15 } },
      { t: 3.5, d: {} },
      { t: 5.25, d: { joint_wheel_left: -0.8, joint_wheel_right: -0.8, joint_swing_left: -0.15, joint_swing_right: -0.15 } },
    ],
  },

  /* LoCoBot: reach out, open the gripper, pull back */
  locobot: {
    period: 8, phase: 3,
    keys: [
      { t: 0,   d: {} },
      { t: 2,   d: { waist: 0.7, shoulder: 0.35, elbow: -0.4, wrist_angle: 0.3, left_finger: 0.015, right_finger: -0.015 } },
      { t: 4,   d: { waist: 0.7, shoulder: 0.5, elbow: -0.2, wrist_angle: 0.5, left_finger: 0, right_finger: 0 } },
      { t: 6,   d: { waist: -0.6, shoulder: 0.2, elbow: -0.3, wrist_rotate: 0.8 } },
    ],
  },

  /* XLeRobot-style SO-101: pan to a target, dip, grab, sweep back */
  so100: {
    period: 9, phase: 0.4,
    keys: [
      { t: 0,   d: {} },
      { t: 2,   d: { Rotation: 0.7, Pitch: 0.4, Elbow: 0.3, Wrist_Pitch: -0.3, Jaw: 0.8 } },
      { t: 3.5, d: { Rotation: 0.7, Pitch: 0.7, Elbow: 0.5, Wrist_Pitch: -0.4, Jaw: 0 } },
      { t: 5.5, d: { Rotation: -0.5, Pitch: 0.2, Elbow: 0.1, Wrist_Roll: 0.8, Jaw: 0.3 } },
      { t: 7.5, d: { Rotation: -0.2, Pitch: 0.1, Wrist_Roll: -0.4 } },
    ],
  },
};

/* Periodic Catmull-Rom through the key values of one joint. */
function crSample(vals, times, period, t) {
  const n = times.length;
  let i = n - 1;
  for (let k = 0; k < n; k += 1) {
    if (t < times[k]) { i = k - 1; break; }
  }
  if (i < 0) i = n - 1;
  const t0 = times[i];
  const t1 = i + 1 < n ? times[i + 1] : times[0] + period;
  const u = (t - t0 + (t < t0 ? period : 0)) / (t1 - t0);
  const p0 = vals[(i - 1 + n) % n];
  const p1 = vals[i];
  const p2 = vals[(i + 1) % n];
  const p3 = vals[(i + 2) % n];
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (
    2 * p1 + (-p0 + p2) * u
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * u3
  );
}

const jointCache = new WeakMap();
function jointsOf(traj) {
  let names = jointCache.get(traj);
  if (!names) {
    names = [...new Set(traj.keys.flatMap((k) => Object.keys(k.d)))];
    jointCache.set(traj, names);
  }
  return names;
}

/* Pose (joint → radians) of `traj` at `time`, on top of the `base` layout pose. */
export function sampleTrajectory(traj, time, base = {}) {
  const t = (((time + traj.phase) % traj.period) + traj.period) % traj.period;
  const times = traj.keys.map((k) => k.t);
  const pose = {};
  for (const name of jointsOf(traj)) {
    const vals = traj.keys.map((k) => k.d[name] ?? 0);
    pose[name] = (base[name] ?? 0) + crSample(vals, times, traj.period, t);
  }
  return pose;
}

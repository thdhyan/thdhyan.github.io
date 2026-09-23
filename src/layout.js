/* Single source of truth for the hero scene arrangement.
   Edited by hand, or via the /editor page (Export JSON → replace this file).
   `rot` = full euler [x, y, z] radians; `joints` = URDF joint poses (name → value). */

export const LAYOUT = {
  /* Hero camera (Hero.jsx Canvas) — tune via /editor "Hero camera" sliders */
  camera: {
    pos: [0, 1, 8],
    fov: 28,
  },
  /* hero-robot.glb is origin-centered (y in [-0.5, 0.5]) — we lift by half of scale */
  hero: {
    model: 'hero-robot',
    pos: [0.9, -0.0572149467569123, 1.6],
    rotY: 0,
    rot: [0, 0, 0],
    scale: 1.8,
    lift: true, // center vertically, then feet land on the ground
  },
  drone: {
    model: 'drone',
    pos: [-0.48807932522414, 1.4731103111721915, 0.5],
    rotY: 0,
    rot: [0, 0, 0],
    scale: 0.5,
    hover: 0.16, // hover bob amplitude (0 = static)
  },
  /* Fleet: loaded as real URDFs at runtime (see src/urdf.js) — textured,
     colored, and poseable via `joints`. Floor-aligned by the loader. */
  fleet: [
    {
      id: 'go2',
      model: 'go2',
      pos: [-0.35228769867768733, 0.12608594294581976, 1.2859826835729482],
      rotY: 4.258603374866164,
      rot: [0, 4.258603374866164, 0],
      scale: 1.2,
      // relaxed stance: knees bent, feet under hips, ~90% of max stand height
      joints: {
        FR_thigh_joint: 0.45, FR_calf_joint: -0.9,
        FL_thigh_joint: 0.45, FL_calf_joint: -0.9,
        RR_thigh_joint: 0.45, RR_calf_joint: -0.9,
        RL_thigh_joint: 0.45, RL_calf_joint: -0.9,
      },
    },
    {
      id: 'spot',
      model: 'spot',
      pos: [1.5642872250507174, 0, 0],
      rotY: 4.537856055185257,
      rot: [0, 4.537856055185257, 0],
      scale: 1,
      // crouched like go1/go2: FK solve feet-under-hip with L1=0.3205,
      // L2=0.3709 -> hip_y=0.6, knee=-1.11 (knee apex back; ~13% lower stance)
      joints: {
        front_left_hip_y: 0.6, front_left_knee: -1.11,
        front_right_hip_y: 0.6, front_right_knee: -1.11,
        rear_left_hip_y: 0.6, rear_left_knee: -1.11,
        rear_right_hip_y: 0.6, rear_right_knee: -1.11,
        front_left_hip_x: -0.105398163397448,
        arm_joint3: 1.76,
        arm_joint2: -1.285191,
        arm_joint1: 1.258407,
        arm_joint5: -0.290796,
        arm_joint6: -0.20706,
        arm_gripper: -0.836263,
      },
    },
    {
      id: 'k1',
      model: 'k1',
      pos: [1.650404449806318, 0, 2.1300628108167143],
      rotY: 4.468042885105484,
      rot: [0, 4.468042885105484, 0],
      scale: 1,
      joints: {
        Head_pitch: 0.091,
        ARight_Shoulder_Pitch: -2.056,
        Left_Elbow_Yaw: -1.4,
        Left_Elbow_Pitch: 0.39,
        Left_Shoulder_Roll: -1.3,
        Right_Shoulder_Roll: 1.45,
        Right_Elbow_Pitch: 0.55,
        Right_Elbow_Yaw: 1.12,
        AAHead_yaw: 0.16,
      },
    },
    {
      id: 'g1',
      model: 'g1',
      pos: [0.36466618427080566, 0.007314184732227558, 1.5755283286322839],
      rotY: -1.9896753472735356,
      rot: [0, -1.9896753472735356, 0],
      scale: 1.2,
      joints: {
        left_hip_pitch_joint: 0.0293,
        left_hip_roll_joint: -0.0036,
        left_knee_joint: 0.252733,
        waist_pitch_joint: 0.02,
        waist_roll_joint: -0.06,
        waist_yaw_joint: 0.222,
        left_wrist_yaw_joint: 0.145570442,
        right_shoulder_pitch_joint: -0.2492,
        right_shoulder_roll_joint: -0.4315,
        right_elbow_joint: -0.3472,
        right_shoulder_yaw_joint: 1.382,
        left_shoulder_roll_joint: -0.0482,
        left_shoulder_pitch_joint: -0.3292,
        left_shoulder_yaw_joint: -1.638,
      },
    },
  ],
};

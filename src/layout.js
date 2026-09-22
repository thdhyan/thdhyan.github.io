/* Single source of truth for the hero scene arrangement.
   Edited by hand, or via the /editor page (Export JSON → replace this file).
   `rot` = full euler [x, y, z] radians; `joints` = URDF joint poses (name → value). */

export const LAYOUT = {
  /* hero-robot.glb is origin-centered (y in [-0.5, 0.5]) — we lift by half of scale */
  hero: {
    model: 'hero-robot',
    pos: [0.9, -0.0572149467569123, 1.6],
    rotY: 0,
    rot: [0, 0, 0],
    scale: 1.6,
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
      pos: [-1.4205581570619636, 0, 0.842735222246218],
      rotY: 4.084070449666731,
      rot: [0, 4.084070449666731, 0],
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
      id: 'go1',
      model: 'go1',
      pos: [1.3968684852490303, 0, 2.96],
      rotY: 4.066617157146788,
      rot: [0, 4.066617157146788, 0.08726646259971647],
      scale: 1.2,
      // relaxed stance (same FK solve as go2)
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
      pos: [1.719307917489376, 0, 0],
      rotY: 5.1487212933832724,
      rot: [0, 5.1487212933832724, 0],
      scale: 1,
      joints: {
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
      pos: [2.15681214423511, 0, 1.7699450711184923],
      rotY: 4.2062434973063345,
      rot: [0, 4.2062434973063345, 0],
      scale: 1,
      joints: {
        Head_pitch: -0.089,
        ARight_Shoulder_Pitch: -2.056,
        Left_Elbow_Yaw: -1.4,
        Left_Elbow_Pitch: 0.39,
        Left_Shoulder_Roll: -1.34,
        Right_Shoulder_Roll: 1.45,
        Right_Elbow_Pitch: -0.25,
        Right_Elbow_Yaw: 1.12,
      },
    },
    {
      id: 'g1',
      model: 'g1',
      pos: [0.2663867661842314, 0.007314184732227558, 1.5755283286322839],
      rotY: -1.9896753472735356,
      rot: [0, -1.9896753472735356, 0],
      scale: 1.2,
    },
    {
      id: 'so100',
      model: 'so100',
      pos: [2.279851673147106, 0, 1],
      rotY: -0.8,
      rot: [0, -0.8, 0],
      scale: 2.05,
    },
    {
      id: 'nova-carter',
      model: 'nova-carter',
      pos: [-0.4551560566686942, 0, 0.8376129612827565],
      rotY: 2.443460952792061,
      rot: [0, 2.443460952792061, 0],
      scale: 1,
    },
  ],
};

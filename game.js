/*! Cosmic Merge (PewPlay edition) - based on "garrulus" by Staś Małolepszy and Michał Budzyński, js13kGames 2026. ISC License, see LICENSE. Built on Goodluck (c) 2019 Contributors to the Goodluck project. */
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // lib/world.ts
  var WorldImpl = class {
    constructor(capacity = 1e4) {
      __publicField(this, "Capacity");
      __publicField(this, "Signature", []);
      __publicField(this, "Graveyard", []);
      this.Capacity = capacity;
    }
  };
  function create_entity(world) {
    if (world.Graveyard.length > 0) {
      return world.Graveyard.pop();
    }
    if (false) {
      throw new Error("No more entities available.");
    }
    return world.Signature.push(0) - 1;
  }
  function destroy_entity(world, entity) {
    world.Signature[entity] = 0;
    if (false) {
      throw new Error("Entity already in graveyard.");
    }
    world.Graveyard.push(entity);
  }

  // lib/game.ts
  var STEP = 1 / 60;
  var GameImpl = class {
    constructor() {
      __publicField(this, "Running", 0);
      __publicField(this, "Now", 0);
      __publicField(this, "ViewportWidth", window.innerWidth);
      __publicField(this, "ViewportHeight", window.innerHeight);
      __publicField(this, "ViewportResized", true);
      // State of input during this frame.
      // 1 = down, 0 = up, or any number for analog inputs.
      __publicField(this, "InputState", {
        MouseX: 0,
        MouseY: 0
      });
      // Changes of InputState that happened right before this frame.
      // 1 = pressed, -1 = released, 0 = no change.
      __publicField(this, "InputDelta", {
        MouseX: 0,
        MouseY: 0
      });
      // Pixels traveled while mouse/touch was down.
      __publicField(this, "InputDistance", {
        Mouse: 0,
        Mouse0: 0,
        Mouse1: 0,
        Mouse2: 0,
        Touch0: 0,
        Touch1: 0
      });
      // Map of touch ids to touch indices. In particular, Firefox assigns high
      // ints as ids. Chrome usually starts at 0, so id === index.
      __publicField(this, "InputTouches", {});
      __publicField(this, "Ui", document.querySelector("main"));
      document.addEventListener(
        "visibilitychange",
        () => document.hidden ? this.Stop() : this.Start()
      );
      for (let target of [this.Ui, document.querySelector("canvas")]) {
        target.addEventListener("contextmenu", (evt) => evt.preventDefault());
      }
      let active = -1;
      let move = (evt) => {
        this.InputDelta["MouseX"] += evt.clientX - this.InputState["MouseX"];
        this.InputDelta["MouseY"] += evt.clientY - this.InputState["MouseY"];
        this.InputState["MouseX"] = evt.clientX;
        this.InputState["MouseY"] = evt.clientY;
      };
      this.Ui.addEventListener("pointerdown", (evt) => {
        if (!evt.isPrimary || evt.button !== 0) {
          return;
        }
        if (evt.target.closest?.("button")) {
          return;
        }
        if (evt.target === this.Ui) {
          evt.preventDefault();
          try {
            this.Ui.setPointerCapture(evt.pointerId);
          } catch {
          }
        }
        active = evt.pointerId;
        move(evt);
        this.InputState["Mouse0"] = 1;
        this.InputDelta["Mouse0"] = 1;
      });
      this.Ui.addEventListener("pointermove", (evt) => {
        if (!evt.isPrimary) {
          return;
        }
        if (evt.pointerType !== "mouse" && evt.pointerId !== active) {
          return;
        }
        move(evt);
      });
      let up = (evt) => {
        if (evt.pointerId !== active) {
          return;
        }
        active = -1;
        move(evt);
        this.InputState["Mouse0"] = 0;
        this.InputDelta["Mouse0"] = evt.type === "pointercancel" ? 0 : -1;
      };
      this.Ui.addEventListener("pointerup", up);
      this.Ui.addEventListener("pointercancel", up);
      window.addEventListener("keydown", (evt) => {
        if (!evt.repeat) {
          this.InputState[evt.code] = 1;
          this.InputDelta[evt.code] = 1;
        }
      });
      window.addEventListener("keyup", (evt) => {
        this.InputState[evt.code] = 0;
        this.InputDelta[evt.code] = -1;
      });
    }
    Start() {
      if (this.Running) {
        return;
      }
      let last = performance.now();
      let accumulator = 0;
      let tick = (now) => {
        let delta = (now - last) / 1e3;
        last = now;
        this.Running = requestAnimationFrame(tick);
        delta = Math.min(delta, 0.1);
        this.FrameSetup(delta);
        accumulator = Math.min(accumulator + delta, 10 * STEP);
        while (accumulator >= STEP) {
          accumulator -= STEP;
          this.FixedUpdate(STEP);
          this.FixedReset(STEP);
        }
        this.FrameUpdate(delta);
        this.FrameReset(delta);
      };
      this.Running = requestAnimationFrame(tick);
    }
    Stop() {
      cancelAnimationFrame(this.Running);
      this.Running = 0;
    }
    FrameSetup(delta) {
      this.Now = performance.now();
      let mouse_distance = Math.abs(this.InputDelta["MouseX"]) + Math.abs(this.InputDelta["MouseY"]);
      this.InputDistance["Mouse"] += mouse_distance;
      if (this.InputState["Mouse0"] === 1) {
        this.InputDistance["Mouse0"] += mouse_distance;
      }
      if (this.InputState["Mouse1"] === 1) {
        this.InputDistance["Mouse1"] += mouse_distance;
      }
      if (this.InputState["Mouse2"] === 1) {
        this.InputDistance["Mouse2"] += mouse_distance;
      }
      if (this.InputState["Touch0"] === 1) {
        this.InputDistance["Touch0"] += Math.abs(this.InputDelta["Touch0X"]) + Math.abs(this.InputDelta["Touch0Y"]);
      }
      if (this.InputState["Touch1"] === 1) {
        this.InputDistance["Touch1"] += Math.abs(this.InputDelta["Touch1X"]) + Math.abs(this.InputDelta["Touch1Y"]);
      }
    }
    FixedUpdate(step) {
    }
    // Input deltas are consumed by the simulation, so they must be cleared
    // after every fixed step, not once per frame.
    FixedReset(step) {
      for (let name in this.InputDelta) {
        this.InputDelta[name] = 0;
      }
    }
    FrameUpdate(delta) {
    }
    FrameReset(delta) {
      this.ViewportResized = false;
      if (this.InputDelta["Mouse0"] === -1) {
        this.InputDistance["Mouse0"] = 0;
      }
      if (this.InputDelta["Mouse1"] === -1) {
        this.InputDistance["Mouse1"] = 0;
      }
      if (this.InputDelta["Mouse2"] === -1) {
        this.InputDistance["Mouse2"] = 0;
      }
      if (this.InputDelta["Touch0"] === -1) {
        this.InputDistance["Touch0"] = 0;
      }
      if (this.InputDelta["Touch1"] === -1) {
        this.InputDistance["Touch1"] = 0;
      }
    }
  };
  var Game2D = class extends GameImpl {
    constructor() {
      super(...arguments);
      __publicField(this, "Canvas", document.querySelector("canvas"));
      __publicField(this, "Context", this.Canvas.getContext("2d"));
      /** Pixels of the canvas backing store for each CSS pixel. */
      __publicField(this, "PixelRatio", 1);
      /**
       * PewPlay: the audio context is made on the first user gesture (see
       * `audio_unlock` in sounds.ts), so that no browser complains about a
       * context made before one.
       */
      __publicField(this, "Audio", null);
      __publicField(this, "Cameras", []);
    }
  };
  function instantiate(game2, blueprint) {
    let entity = create_entity(game2.World);
    for (let mixin of blueprint) {
      mixin(game2, entity);
    }
    return entity;
  }

  // src/modes.ts
  var DISTANCE_SCALE_MULTIPLIER = 4;
  var RADII = [0.4, 0.48, 0.58, 0.69, 0.83, 1.06, 1.36, 1.74, 2.23, 2.85];
  var TUNING = {
    Name: "Maelstrom",
    Blurb: "Tight, lumpy, and turning.",
    OrbitRadius: 9.5,
    DeathRadius: 8,
    CenterPull: 16,
    Drag: 0.4,
    Bounce: 0.2,
    Friction: 0.5,
    Spin: 12,
    SolverIterations: 8,
    SubSteps: 3,
    DropCooldown: 0.35,
    DropSpeed: 8,
    Fling: 0.45,
    Radii: RADII,
    ScaleCenter: 0.7,
    ScaleEdge: 1.3,
    Bumps: 2,
    DeadStars: 2
  };
  function scale_at(tuning, reach) {
    return tuning.ScaleCenter + (tuning.ScaleEdge - tuning.ScaleCenter) * DISTANCE_SCALE_MULTIPLIER * reach;
  }
  var MAX_CAMERA_RADIUS = TUNING.OrbitRadius + 1.5;
  function camera_radius(tuning) {
    return tuning.OrbitRadius + 1.5;
  }

  // lib/easing.ts
  function ease_out_quad(t) {
    return 1 - (1 - t) ** 2;
  }

  // src/world.ts
  var FLOATS_PER_INSTANCE = 6;
  var World = class extends WorldImpl {
    constructor() {
      super(...arguments);
      __publicField(this, "InstanceData", new Float32Array(this.Capacity * FLOATS_PER_INSTANCE));
      __publicField(this, "AnimatePop", []);
      __publicField(this, "Camera2D", []);
      __publicField(this, "Children", []);
      __publicField(this, "CollideCircle", []);
      __publicField(this, "DropCloud", []);
      __publicField(this, "Lifespan", []);
      __publicField(this, "LocalTransform2D", []);
      __publicField(this, "Merge", []);
      __publicField(this, "RigidBody2D", []);
      __publicField(this, "SpatialNode2D", []);
    }
  };

  // src/systems/sys_animate_pop.ts
  var QUERY = 1 /* AnimatePop */ | 128 /* LocalTransform2D */;
  function sys_animate_pop(game2, delta) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY) === QUERY) {
        update(game2, ent, delta);
      }
    }
  }
  function update(game2, entity, delta) {
    let pop = game2.World.AnimatePop[entity];
    let local = game2.World.LocalTransform2D[entity];
    pop.Time += delta;
    let progress = Math.min(pop.Time / pop.Total, 1);
    let scale = 1 + (POP_SCALE - 1) * (1 - ease_out_quad(progress));
    local.Scale[0] = local.Scale[1] = scale;
    game2.World.Signature[entity] |= 16 /* Dirty */;
    if (progress === 1) {
      game2.World.Signature[entity] &= ~1 /* AnimatePop */;
    }
  }

  // lib/mat2d.ts
  function mat2d_create() {
    return [1, 0, 0, 1, 0, 0];
  }
  function mat2d_set(out, a, b, c, d, tx, ty) {
    out[0] = a;
    out[1] = b;
    out[2] = c;
    out[3] = d;
    out[4] = tx;
    out[5] = ty;
    return out;
  }
  function mat2d_copy(out, a) {
    mat2d_set(out, a[0], a[1], a[2], a[3], a[4], a[5]);
    return out;
  }
  function mat2d_invert(out, a) {
    let aa = a[0], ab = a[1], ac = a[2], ad = a[3];
    let atx = a[4], aty = a[5];
    let det = aa * ad - ab * ac;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
  }
  function mat2d_multiply(out, a, b) {
    let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
  }
  function mat2d_compose(out, v, r, s) {
    let sin = Math.sin(r);
    let cos = Math.cos(r);
    out[0] = cos * s[0];
    out[1] = sin * s[0];
    out[2] = -sin * s[1];
    out[3] = cos * s[1];
    out[4] = v[0];
    out[5] = v[1];
    return out;
  }
  function mat2d_get_translation(out, a) {
    out[0] = a[4];
    out[1] = a[5];
    return out;
  }
  function mat2d_from_ortho(out, left, top) {
    mat2d_set(out, 1 / left, 0, 0, 1 / top, 0, 0);
    return out;
  }

  // src/systems/sys_camera2d.ts
  var QUERY2 = 1024 /* SpatialNode2D */ | 2 /* Camera2D */;
  function sys_camera2d(game2, delta) {
    game2.Cameras = [];
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY2) === QUERY2) {
        let camera = game2.World.Camera2D[ent];
        let camera_node = game2.World.SpatialNode2D[ent];
        mat2d_multiply(camera.Pv, camera.Projection.Projection, camera_node.Self);
        mat2d_copy(camera.World, camera_node.World);
        game2.Cameras.push(ent);
      }
    }
  }

  // lib/math.ts
  var DEG_TO_RAD = Math.PI / 180;
  var RAD_TO_DEG = 180 / Math.PI;

  // src/systems/sys_collide_circle.ts
  var QUERY3 = 128 /* LocalTransform2D */ | 8 /* CollideCircle */ | 512 /* RigidBody2D */;
  var bodies = [];
  function part_world(out, game2, entity, part) {
    let local = game2.World.LocalTransform2D[entity];
    let parts = game2.World.CollideCircle[entity].Parts;
    let ox = parts[part];
    let oy = parts[part + 1];
    if (ox === 0 && oy === 0) {
      out[0] = local.Translation[0];
      out[1] = local.Translation[1];
    } else {
      let angle = local.Rotation * DEG_TO_RAD;
      let sin = Math.sin(angle);
      let cos = Math.cos(angle);
      out[0] = local.Translation[0] + ox * cos - oy * sin;
      out[1] = local.Translation[1] + ox * sin + oy * cos;
    }
    out[2] = parts[part + 2];
  }
  var part_a = [0, 0, 0];
  var part_b = [0, 0, 0];
  function sys_collide_circle(game2, delta) {
    bodies.length = 0;
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY3) === QUERY3) {
        bodies.push(ent);
      }
    }
    game2.ContactCount = 0;
    for (let i = 0; i < bodies.length; i++) {
      let a = bodies[i];
      let collide_a = game2.World.CollideCircle[a];
      let position_a = game2.World.LocalTransform2D[a].Translation;
      for (let j = i + 1; j < bodies.length; j++) {
        let b = bodies[j];
        let collide_b = game2.World.CollideCircle[b];
        if (!(collide_a.Layer & collide_b.Mask)) {
          continue;
        }
        let position_b = game2.World.LocalTransform2D[b].Translation;
        let dx = position_b[0] - position_a[0];
        let dy = position_b[1] - position_a[1];
        let reach = collide_a.Radius + collide_b.Radius;
        if (dx * dx + dy * dy >= reach * reach) {
          continue;
        }
        for (let pa = 0; pa < collide_a.Parts.length; pa += 3) {
          part_world(part_a, game2, a, pa);
          for (let pb = 0; pb < collide_b.Parts.length; pb += 3) {
            part_world(part_b, game2, b, pb);
            let px = part_b[0] - part_a[0];
            let py = part_b[1] - part_a[1];
            let sum = part_a[2] + part_b[2];
            if (px * px + py * py >= sum * sum) {
              continue;
            }
            let contact = game2.Contacts[game2.ContactCount];
            if (contact === void 0) {
              contact = game2.Contacts[game2.ContactCount] = {
                A: 0,
                B: 0,
                PartA: 0,
                PartB: 0,
                Sum: 0
              };
            }
            contact.A = a;
            contact.B = b;
            contact.PartA = pa;
            contact.PartB = pb;
            contact.Sum = sum;
            game2.ContactCount++;
          }
        }
      }
    }
  }

  // lib/random.ts
  var seed = 1;
  function set_seed(new_seed) {
    seed = 198706 * new_seed;
  }
  function rand() {
    seed = seed * 16807 % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function integer(min = 0, max = 1) {
    return ~~(rand() * (max - min + 1) + min);
  }
  function float(min = 0, max = 1) {
    return rand() * (max - min) + min;
  }

  // lib/vec2.ts
  function vec2_transform_position(out, a, m) {
    let x = a[0];
    let y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
  }

  // src/components/com_camera2d.ts
  function camera2d(radius) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 2 /* Camera2D */;
      game2.World.Camera2D[entity] = {
        Projection: {
          Radius: radius,
          Projection: [1 / radius[0], 0, 0, 1 / radius[1], 0, 0],
          Inverse: [radius[0], 0, 0, radius[1], 0, 0]
        },
        Pv: mat2d_create(),
        World: mat2d_create(),
        ViewportWidth: 0,
        ViewportHeight: 0
      };
    };
  }
  function viewport_to_world(out, camera, pos) {
    out[0] = pos[0] / camera.ViewportWidth * 2 - 1;
    out[1] = -(pos[1] / camera.ViewportHeight) * 2 + 1;
    vec2_transform_position(out, out, camera.Projection.Inverse);
    vec2_transform_position(out, out, camera.World);
  }

  // src/components/com_collide_circle.ts
  function collide_circle(parts, layer, mask) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 8 /* CollideCircle */;
      let collide = {
        BaseParts: parts,
        Parts: parts.slice(),
        Radius: 0,
        Layer: layer,
        Mask: mask
      };
      scale_parts(collide, 1);
      game2.World.CollideCircle[entity] = collide;
    };
  }
  function scale_parts(collide, factor) {
    let base = collide.BaseParts;
    let parts = collide.Parts;
    let radius = 0;
    for (let i = 0; i < base.length; i += 3) {
      let x = parts[i] = base[i] * factor;
      let y = parts[i + 1] = base[i + 1] * factor;
      let r = parts[i + 2] = base[i + 2] * factor;
      radius = Math.max(radius, Math.hypot(x, y) + r);
    }
    collide.Radius = radius;
  }
  function element_parts(radius, bumps, seed2) {
    if (bumps === 0) {
      return [0, 0, radius];
    }
    let core = radius * 0.82;
    let bump = radius * 0.42;
    let distance = core + bump * 0.45;
    let parts = [0, 0, core];
    for (let i = 0; i < bumps; i++) {
      let angle = seed2 + i / bumps * Math.PI * 2;
      parts.push(Math.cos(angle) * distance, Math.sin(angle) * distance, bump);
    }
    return parts;
  }

  // src/components/com_local_transform2d.ts
  function local_transform2d(translation = [0, 0], rotation = 0, scale = [1, 1]) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 128 /* LocalTransform2D */ | 16 /* Dirty */;
      game2.World.LocalTransform2D[entity] = {
        Translation: translation,
        Rotation: rotation,
        Scale: scale
      };
    };
  }

  // src/components/com_merge.ts
  function merge(tier, cooldown = 0) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 256 /* Merge */;
      game2.World.Merge[entity] = {
        Tier: tier,
        Cooldown: cooldown,
        Merging: false,
        Armed: false
      };
    };
  }

  // src/components/com_rigid_body2d.ts
  function rigid_body2d(radius, velocity, velocity_angular = 0, immovable = false) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 512 /* RigidBody2D */;
      game2.World.RigidBody2D[entity] = {
        Velocity: velocity,
        VelocityAngular: velocity_angular,
        InverseMass: immovable ? 0 : 1 / (radius * radius)
      };
    };
  }

  // src/components/com_spatial_node2d.ts
  function spatial_node2d(is_gyroscope = false) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 1024 /* SpatialNode2D */ | 16 /* Dirty */;
      game2.World.SpatialNode2D[entity] = {
        World: game2.World.InstanceData.subarray(
          entity * FLOATS_PER_INSTANCE,
          entity * FLOATS_PER_INSTANCE + 6
        ),
        Self: mat2d_create(),
        IsGyroscope: is_gyroscope
      };
    };
  }

  // src/scenes/blu_element.ts
  var SCORES = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
  var COLORS = [
    "#ff9ecd",
    "#ffe066",
    "#ff7a8a",
    "#9fd8ff",
    "#7ef0c0",
    "#c39bff",
    "#ffab5e",
    "#6f8cff",
    "#ff6bdb",
    "#fff3c4"
  ];
  var TOP_TIER = SCORES.length - 1;
  function blueprint_element(game2, tier, position, velocity) {
    let radius = game2.Tuning.Radii[tier];
    let parts = element_parts(radius, game2.Tuning.Bumps, float(0, Math.PI * 2));
    return [
      spatial_node2d(),
      local_transform2d(position, float(0, 360)),
      collide_circle(parts, 1 /* Element */, 1 /* Element */ | 2 /* Star */),
      rigid_body2d(radius, velocity, float(-120, 120)),
      merge(tier)
    ];
  }

  // src/sounds.ts
  var master = null;
  var muted = (() => {
    try {
      return localStorage.getItem("cosmic-merge:muted") === "1";
    } catch {
      return false;
    }
  })();
  function audio_unlock(game2) {
    if (!game2.Audio) {
      let Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        return;
      }
      game2.Audio = new Ctor();
      master = game2.Audio.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(game2.Audio.destination);
    }
    if (game2.Audio.state === "suspended") {
      game2.Audio.resume().catch(() => {
      });
    }
  }
  function toggle_mute(game2) {
    muted = !muted;
    try {
      localStorage.setItem("cosmic-merge:muted", muted ? "1" : "0");
    } catch {
    }
    if (master && game2.Audio) {
      master.gain.setValueAtTime(muted ? 0 : 1, game2.Audio.currentTime);
    }
  }
  function hz(note2) {
    return 440 * 2 ** ((note2 - 69) / 12);
  }
  function note(audio, note2, length, gain, kind = "triangle", delay = 0) {
    if (!audio || !master || audio.state !== "running") {
      return;
    }
    let start = audio.currentTime + delay;
    let osc = audio.createOscillator();
    let envelope = audio.createGain();
    osc.type = kind;
    osc.frequency.value = hz(note2);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(gain, start + 1e-3);
    envelope.gain.exponentialRampToValueAtTime(1e-4, start + length);
    osc.connect(envelope);
    envelope.connect(master);
    osc.start(start);
    osc.stop(start + length);
  }
  function sound_drop(game2) {
    note(game2.Audio, 44, 0.06, 0.09, "square");
  }
  function sound_merge(game2, tier) {
    let root = 60 + 2 * tier;
    note(game2.Audio, root, 0.15, 0.16);
    if (tier >= 5) {
      note(game2.Audio, root + 7, 0.22, 0.1, "triangle", 0.02);
      note(game2.Audio, root + 12, 0.3, 0.08, "sine", 0.04);
    }
  }
  function sound_over(game2) {
    note(game2.Audio, 62, 0.3, 0.14, "triangle", 0);
    note(game2.Audio, 57, 0.3, 0.14, "triangle", 0.14);
    note(game2.Audio, 50, 0.7, 0.16, "triangle", 0.28);
  }
  function sound_win(game2) {
    for (let i = 0; i < 5; i++) {
      note(game2.Audio, 64 + [0, 4, 7, 12, 16][i], 0.5, 0.12, "triangle", i * 0.07);
    }
  }
  function sound_music(game2) {
    if (game2.PlayState !== "play") {
      game2.MusicNext = 0;
      return;
    }
    let audio = game2.Audio;
    if (!audio || audio.state !== "running") {
      return;
    }
    if (!game2.MusicNext) {
      game2.MusicNext = audio.currentTime;
    }
    let bass = [40, 40, 43, 40, 47, 45, 43, 38];
    while (game2.MusicNext < audio.currentTime + 0.2) {
      let step = game2.MusicStep++ % 16;
      let delay = Math.max(0, game2.MusicNext - audio.currentTime);
      note(audio, 82, 0.025, step % 4 === 2 ? 0.018 : 0.03, "square", delay);
      if (step % 2 === 0) {
        note(audio, bass[step / 2], 0.11, 0.035, "sawtooth", delay);
      }
      if (step === 0 || step === 7 || step === 10) {
        note(audio, 28, 0.09, 0.06, "sine", delay);
      }
      if (step === 4 || step === 12) {
        note(audio, 74, 0.045, 0.025, "square", delay);
      }
      game2.MusicNext += 0.125;
    }
  }

  // src/systems/sys_control_cloud.ts
  var QUERY4 = 128 /* LocalTransform2D */ | 32 /* DropCloud */;
  var TIER_WEIGHTS = [32, 58, 78, 92, 100];
  function roll_tier() {
    let roll = integer(0, 99);
    for (let tier = 0; tier < TIER_WEIGHTS.length; tier++) {
      if (roll < TIER_WEIGHTS[tier]) {
        return tier;
      }
    }
    return 0;
  }
  var pointer = [0, 0];
  var MAX_SWING = 8;
  var SWING_SMOOTHING = 0.25;
  function sys_control_cloud(game2, delta) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY4) === QUERY4) {
        update2(game2, ent, delta);
      }
    }
  }
  function drop_velocity(inward, sideways, angle) {
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    return [-cos * inward - sin * sideways, -sin * inward + cos * sideways];
  }
  function update2(game2, entity, delta) {
    let tuning = game2.Tuning;
    let cloud = game2.World.DropCloud[entity];
    cloud.Cooldown -= delta;
    let camera_entity = game2.Cameras[0];
    if (camera_entity === void 0) {
      return;
    }
    let camera = game2.World.Camera2D[camera_entity];
    if (camera.ViewportWidth === 0) {
      return;
    }
    pointer[0] = game2.InputState["MouseX"];
    pointer[1] = game2.InputState["MouseY"];
    viewport_to_world(pointer, camera, pointer);
    let angle = Math.atan2(pointer[1], pointer[0]);
    let turned = angle - cloud.Angle;
    turned = Math.atan2(Math.sin(turned), Math.cos(turned));
    let swing = Math.max(-MAX_SWING, Math.min(MAX_SWING, turned / delta));
    cloud.Swing += (swing - cloud.Swing) * SWING_SMOOTHING;
    cloud.Angle = angle;
    let local = game2.World.LocalTransform2D[entity];
    local.Translation[0] = Math.cos(cloud.Angle) * tuning.OrbitRadius;
    local.Translation[1] = Math.sin(cloud.Angle) * tuning.OrbitRadius;
    local.Rotation = cloud.Angle * RAD_TO_DEG + 90;
    game2.World.Signature[entity] |= 16 /* Dirty */;
    let released = game2.InputDelta["Mouse0"] === -1;
    if (released && cloud.Cooldown <= 0) {
      instantiate(
        game2,
        blueprint_element(
          game2,
          cloud.NextTier,
          [local.Translation[0], local.Translation[1]],
          drop_velocity(
            tuning.DropSpeed,
            tuning.Fling * cloud.Swing * tuning.OrbitRadius,
            cloud.Angle
          )
        )
      );
      cloud.NextTier = roll_tier();
      cloud.Cooldown = tuning.DropCooldown;
      sound_drop(game2);
    }
  }

  // src/systems/sys_draw.ts
  var TAU = Math.PI * 2;
  var STARS = [];
  set_seed(7);
  for (let i = 0; i < 260; i++) {
    let angle = float(0, TAU);
    let dist = Math.sqrt(float(0, 1)) * MAX_CAMERA_RADIUS * 3.1;
    STARS.push(Math.cos(angle) * dist, Math.sin(angle) * dist, float(0.04, 0.09));
  }
  var QUERY_ELEMENT = 1024 /* SpatialNode2D */ | 8 /* CollideCircle */ | 256 /* Merge */;
  var QUERY_STAR = 1024 /* SpatialNode2D */ | 8 /* CollideCircle */ | 512 /* RigidBody2D */;
  var QUERY_CLOUD = 1024 /* SpatialNode2D */ | 32 /* DropCloud */;
  var QUERY_RING = 1024 /* SpatialNode2D */ | 64 /* Lifespan */;
  var ordered = [];
  function sys_draw(game2, delta) {
    let camera_entity = game2.Cameras[0];
    if (camera_entity === void 0) {
      return;
    }
    let camera = game2.World.Camera2D[camera_entity];
    let ctx = game2.Context;
    ctx.setTransform(game2.PixelRatio, 0, 0, game2.PixelRatio, 0, 0);
    ctx.fillStyle = "#080614";
    ctx.fillRect(0, 0, game2.ViewportWidth, game2.ViewportHeight);
    ctx.transform(
      camera.Pv[0] * game2.ViewportWidth / 2,
      -camera.Pv[1] * game2.ViewportHeight / 2,
      -camera.Pv[2] * game2.ViewportWidth / 2,
      camera.Pv[3] * game2.ViewportHeight / 2,
      (1 + camera.Pv[4]) * game2.ViewportWidth / 2,
      (1 - camera.Pv[5]) * game2.ViewportHeight / 2
    );
    ctx.scale(1, -1);
    if (game2.ShakeAmount > 1e-3) {
      let shake = game2.ShakeAmount = Math.min(game2.ShakeAmount, SHAKE_MAX);
      ctx.translate(float(-shake, shake), float(-shake, shake));
      game2.ShakeAmount *= SHAKE_DECAY;
    } else {
      game2.ShakeAmount = 0;
    }
    draw_background(game2, ctx);
    draw_rings(game2, ctx, game2.BreachTime / BREACH_LIMIT);
    draw_stars(game2, ctx);
    draw_elements(game2, ctx);
    draw_rings_of_merges(game2, ctx);
    draw_clouds(game2, ctx);
    if (game2.PlayState === "play") {
      draw_merge_guide(game2, ctx);
    }
  }
  function draw_merge_guide(game2, ctx) {
    let height = Math.min(GUIDE_HEIGHT, game2.ViewportHeight * 0.12);
    let top = game2.ViewportHeight - height;
    let row = Math.min(game2.ViewportWidth - 16, 620);
    let left = (game2.ViewportWidth - row) / 2;
    let step = row / (COLORS.length + 1);
    let y = top + height / 2;
    let radius = Math.max(4, Math.min(9, step / 4, height / 4));
    ctx.setTransform(game2.PixelRatio, 0, 0, game2.PixelRatio, 0, 0);
    ctx.fillStyle = "#080614bb";
    ctx.fillRect(0, top, game2.ViewportWidth, height);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#cfc8ff";
    ctx.lineCap = "round";
    let arrow = Math.min(3, radius / 2);
    for (let tier = 0; tier < COLORS.length; tier++) {
      let x = left + (tier + 0.5) * step;
      ctx.fillStyle = COLORS[tier];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
      let a = x + radius + 3;
      let b = x + step - radius - 3;
      if (b - a > 4) {
        ctx.beginPath();
        ctx.moveTo(a, y);
        ctx.lineTo(b, y);
        ctx.moveTo(b - arrow, y - arrow);
        ctx.lineTo(b, y);
        ctx.lineTo(b - arrow, y + arrow);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#fff3c4";
    ctx.font = `700 ${Math.round(radius * 2.4)}px system-ui,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", left + (COLORS.length + 0.5) * step, y);
  }
  function draw_background(game2, ctx) {
    let death = game2.Tuning.DeathRadius;
    let glow = ctx.createRadialGradient(0, 0, 0, 0, 0, death);
    glow.addColorStop(0, "#1e1746");
    glow.addColorStop(1, "#08061400");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, death, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#cfc8ff";
    for (let i = 0; i < STARS.length; i += 3) {
      ctx.fillRect(STARS[i], STARS[i + 1], STARS[i + 2], STARS[i + 2]);
    }
  }
  function draw_rings(game2, ctx, breach) {
    let heat = Math.min(breach, 1);
    ctx.strokeStyle = `rgb(${58 + 197 * heat} ${47 - 25 * heat} ${107 - 30 * heat})`;
    ctx.lineWidth = 0.05 + 0.09 * heat;
    ctx.beginPath();
    ctx.arc(0, 0, game2.Tuning.DeathRadius, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = "#2a2350";
    ctx.lineWidth = 0.03;
    ctx.setLineDash([0.2, 0.25]);
    ctx.beginPath();
    ctx.arc(0, 0, game2.Tuning.OrbitRadius, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function draw_elements(game2, ctx) {
    ordered.length = 0;
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY_ELEMENT) === QUERY_ELEMENT) {
        ordered.push(ent);
      }
    }
    ordered.sort((a, b) => game2.World.Merge[a].Tier - game2.World.Merge[b].Tier);
    for (let i = 0; i < ordered.length; i++) {
      let ent = ordered[i];
      let node = game2.World.SpatialNode2D[ent];
      let parts = game2.World.CollideCircle[ent].Parts;
      let color = COLORS[game2.World.Merge[ent].Tier];
      ctx.save();
      ctx.transform(
        node.World[0],
        node.World[1],
        node.World[2],
        node.World[3],
        node.World[4],
        node.World[5]
      );
      draw_body(ctx, parts, color);
      ctx.restore();
    }
  }
  function draw_body(ctx, parts, color) {
    for (let i = 3; i < parts.length; i += 3) {
      ctx.save();
      ctx.translate(parts[i], parts[i + 1]);
      draw_blob(ctx, parts[i + 2], color);
      ctx.restore();
    }
    draw_blob(ctx, parts[2], color);
    draw_face(ctx, parts[2]);
  }
  function draw_blob(ctx, radius, color) {
    let shade = ctx.createRadialGradient(
      -radius * 0.35,
      radius * 0.35,
      radius * 0.1,
      0,
      0,
      radius * 1.15
    );
    shade.addColorStop(0, "#ffffff");
    shade.addColorStop(0.35, color);
    shade.addColorStop(1, color);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.lineWidth = radius * 0.08;
    ctx.strokeStyle = "#00000040";
    ctx.stroke();
  }
  function draw_face(ctx, radius) {
    ctx.strokeStyle = "#20123a";
    ctx.lineWidth = radius * 0.09;
    ctx.lineCap = "round";
    let eye = radius * 0.3;
    ctx.beginPath();
    ctx.arc(-eye, radius * 0.12, radius * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.moveTo(eye + radius * 0.2, radius * 0.12);
    ctx.arc(eye, radius * 0.12, radius * 0.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -radius * 0.1, radius * 0.22, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }
  function draw_clouds(game2, ctx) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY_CLOUD) !== QUERY_CLOUD) {
        continue;
      }
      let node = game2.World.SpatialNode2D[ent];
      let cloud = game2.World.DropCloud[ent];
      ctx.save();
      ctx.transform(
        node.World[0],
        node.World[1],
        node.World[2],
        node.World[3],
        node.World[4],
        node.World[5]
      );
      let radius = game2.Tuning.Radii[cloud.NextTier] * scale_at(game2.Tuning, 1);
      ctx.globalAlpha = cloud.Cooldown > 0 ? 0.25 : 0.75;
      draw_blob(ctx, radius, COLORS[cloud.NextTier]);
      ctx.globalAlpha = 1;
      ctx.translate(0, -0.75);
      ctx.fillStyle = "#e8e4ff";
      ctx.beginPath();
      ctx.arc(-0.42, 0, 0.34, 0, TAU);
      ctx.arc(0.42, 0, 0.34, 0, TAU);
      ctx.arc(0, 0.16, 0.46, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  function draw_rings_of_merges(game2, ctx) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY_RING) !== QUERY_RING) {
        continue;
      }
      let node = game2.World.SpatialNode2D[ent];
      let left = game2.World.Lifespan[ent].Remaining / POP_RING_LIFE;
      ctx.save();
      ctx.transform(
        node.World[0],
        node.World[1],
        node.World[2],
        node.World[3],
        node.World[4],
        node.World[5]
      );
      ctx.globalAlpha = left * 0.7;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 0.1 * left;
      ctx.beginPath();
      ctx.arc(0, 0, 1 + 1.1 * (1 - left), 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
  function draw_stars(game2, ctx) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY_STAR) !== QUERY_STAR || game2.World.Signature[ent] & 256 /* Merge */) {
        continue;
      }
      let node = game2.World.SpatialNode2D[ent];
      let radius = game2.World.CollideCircle[ent].Radius;
      ctx.save();
      ctx.transform(
        node.World[0],
        node.World[1],
        node.World[2],
        node.World[3],
        node.World[4],
        node.World[5]
      );
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fillStyle = "#2b2748";
      ctx.fill();
      ctx.lineWidth = radius * 0.12;
      ctx.strokeStyle = "#4a4270";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-radius * 0.45, 0);
      ctx.lineTo(radius * 0.45, 0);
      ctx.moveTo(0, -radius * 0.45);
      ctx.lineTo(0, radius * 0.45);
      ctx.strokeStyle = "#6b60a0";
      ctx.lineWidth = radius * 0.1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // src/systems/sys_game_over.ts
  var QUERY5 = 128 /* LocalTransform2D */ | 8 /* CollideCircle */ | 256 /* Merge */;
  function sys_game_over(game2, delta) {
    game2.RunTime += delta;
    if (game2.WinTime > 0) {
      game2.WinTime -= delta;
    }
    let breached = false;
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY5) !== QUERY5) {
        continue;
      }
      let position = game2.World.LocalTransform2D[ent].Translation;
      let reach = Math.sqrt(position[0] * position[0] + position[1] * position[1]) + game2.World.CollideCircle[ent].Radius;
      let element = game2.World.Merge[ent];
      if (reach <= game2.Tuning.DeathRadius) {
        element.Armed = true;
      } else if (element.Armed) {
        breached = true;
      }
    }
    game2.BreachTime = breached ? game2.BreachTime + delta : Math.max(0, game2.BreachTime - 2 * delta);
    if (game2.BreachTime >= BREACH_LIMIT) {
      game2.PlayState = "over";
      sound_over(game2);
      game2.NewBest = game2.Score > game2.BestScore;
      if (game2.Score > game2.BestScore) {
        game2.BestScore = game2.Score;
        try {
          localStorage.setItem("cosmic-merge:best", String(game2.BestScore));
        } catch {
        }
      }
    }
  }

  // src/components/com_children.ts
  function destroy_all(world, entity) {
    if (world.Signature[entity] & 4 /* Children */) {
      for (let child of world.Children[entity].Children) {
        destroy_all(world, child);
      }
    }
    if (world.Signature[entity] === 0 /* None */) {
    } else {
      destroy_entity(world, entity);
    }
  }

  // src/systems/sys_lifespan.ts
  var QUERY6 = 64 /* Lifespan */;
  function sys_lifespan(game2, delta) {
    for (let i = 0; i < game2.World.Signature.length; i++) {
      if ((game2.World.Signature[i] & QUERY6) == QUERY6) {
        update3(game2, i, delta);
      }
    }
  }
  function update3(game2, entity, delta) {
    let lifespan2 = game2.World.Lifespan[entity];
    lifespan2.Remaining -= delta;
    if (lifespan2.Remaining < 0) {
      destroy_all(game2.World, entity);
    }
  }

  // src/components/com_animate_pop.ts
  function animate_pop(total = 0.2) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 1 /* AnimatePop */;
      game2.World.AnimatePop[entity] = {
        Time: 0,
        Total: total
      };
    };
  }

  // src/components/com_lifespan.ts
  function lifespan(remaining) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 64 /* Lifespan */;
      game2.World.Lifespan[entity] = {
        Remaining: remaining
      };
    };
  }

  // src/scenes/blu_pop_ring.ts
  function blueprint_pop_ring(position, radius) {
    return [
      spatial_node2d(),
      local_transform2d([position[0], position[1]], 0, [radius, radius]),
      lifespan(POP_RING_LIFE)
    ];
  }

  // src/systems/sys_merge.ts
  function sys_merge(game2, delta) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if (game2.World.Signature[ent] & 256 /* Merge */) {
        let element = game2.World.Merge[ent];
        element.Cooldown -= delta;
        element.Merging = false;
      }
    }
    for (let i = 0; i < game2.ContactCount; i++) {
      let contact = game2.Contacts[i];
      let keep = Math.min(contact.A, contact.B);
      let gone = Math.max(contact.A, contact.B);
      let mask = 256 /* Merge */ | 128 /* LocalTransform2D */ | 512 /* RigidBody2D */ | 8 /* CollideCircle */;
      if ((game2.World.Signature[keep] & mask) !== mask) {
        continue;
      }
      if ((game2.World.Signature[gone] & mask) !== mask) {
        continue;
      }
      let merge_keep = game2.World.Merge[keep];
      let merge_gone = game2.World.Merge[gone];
      if (merge_keep.Tier !== merge_gone.Tier || merge_keep.Cooldown > 0 || merge_gone.Cooldown > 0 || merge_keep.Merging || merge_gone.Merging) {
        continue;
      }
      merge_keep.Merging = merge_gone.Merging = true;
      merge2(game2, keep, gone);
    }
  }
  function merge2(game2, keep, gone) {
    let tier = game2.World.Merge[keep].Tier;
    let local_keep = game2.World.LocalTransform2D[keep];
    let local_gone = game2.World.LocalTransform2D[gone];
    let body_keep = game2.World.RigidBody2D[keep];
    let body_gone = game2.World.RigidBody2D[gone];
    let x = (local_keep.Translation[0] + local_gone.Translation[0]) / 2;
    let y = (local_keep.Translation[1] + local_gone.Translation[1]) / 2;
    let vx = (body_keep.Velocity[0] + body_gone.Velocity[0]) / 2;
    let vy = (body_keep.Velocity[1] + body_gone.Velocity[1]) / 2;
    destroy_entity(game2.World, gone);
    instantiate(game2, blueprint_pop_ring([x, y], game2.Tuning.Radii[tier]));
    if (tier === TOP_TIER) {
      destroy_entity(game2.World, keep);
      if (game2.PlayState === "play") {
        game2.Score += SCORES[tier] * 2;
      }
      game2.Won = true;
      game2.WinTime = WIN_BANNER;
      game2.ShakeAmount += SHAKE_PER_TIER * (tier + 2);
      game2.HitStop = HITSTOP_BIG;
      sound_win(game2);
      return;
    }
    let next = tier + 1;
    let radius = game2.Tuning.Radii[next];
    game2.World.Merge[keep].Tier = next;
    game2.World.Merge[keep].Cooldown = MERGE_COOLDOWN;
    let collide = game2.World.CollideCircle[keep];
    collide.BaseParts = element_parts(radius, game2.Tuning.Bumps, float(0, Math.PI * 2));
    collide.Parts = collide.BaseParts.slice();
    scale_parts(collide, 1);
    body_keep.InverseMass = 1 / (radius * radius);
    body_keep.Velocity[0] = vx;
    body_keep.Velocity[1] = vy;
    local_keep.Translation[0] = x;
    local_keep.Translation[1] = y;
    game2.World.Signature[keep] |= 16 /* Dirty */;
    animate_pop()(game2, keep);
    if (game2.PlayState === "play") {
      game2.Score += SCORES[next];
    }
    game2.ShakeAmount += SHAKE_PER_TIER * next;
    game2.HitStop = next < HITSTOP_TIER ? HITSTOP_SMALL : HITSTOP_BIG;
    sound_merge(game2, next);
  }

  // src/systems/sys_physics2d_integrate.ts
  var QUERY7 = 128 /* LocalTransform2D */ | 512 /* RigidBody2D */;
  function sys_physics2d_integrate(game2, delta) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY7) === QUERY7) {
        update4(game2, ent, delta);
      }
    }
  }
  function update4(game2, entity, delta) {
    let local = game2.World.LocalTransform2D[entity];
    let body = game2.World.RigidBody2D[entity];
    if (body.InverseMass === 0) {
      return;
    }
    let tuning = game2.Tuning;
    let position = local.Translation;
    let velocity = body.Velocity;
    let distance = Math.sqrt(position[0] * position[0] + position[1] * position[1]);
    if (distance > 0) {
      let pull = tuning.CenterPull * delta / distance;
      velocity[0] -= position[0] * pull;
      velocity[1] -= position[1] * pull;
    }
    let damping = Math.max(0, 1 - tuning.Drag * delta);
    velocity[0] *= damping;
    velocity[1] *= damping;
    body.VelocityAngular *= damping;
    position[0] += velocity[0] * delta;
    position[1] += velocity[1] * delta;
    local.Rotation += body.VelocityAngular * delta;
    game2.World.Signature[entity] |= 16 /* Dirty */;
  }

  // src/systems/sys_physics2d_resolve.ts
  var SLOP = 5e-3;
  var CORRECTION = 0.6;
  var part_a2 = [0, 0, 0];
  var part_b2 = [0, 0, 0];
  function sys_physics2d_resolve(game2, delta) {
    let tuning = game2.Tuning;
    for (let iteration = 0; iteration < tuning.SolverIterations; iteration++) {
      for (let i = 0; i < game2.ContactCount; i++) {
        let contact = game2.Contacts[i];
        let body_a = game2.World.RigidBody2D[contact.A];
        let body_b = game2.World.RigidBody2D[contact.B];
        let inverse_sum = body_a.InverseMass + body_b.InverseMass;
        if (inverse_sum === 0) {
          continue;
        }
        part_world(part_a2, game2, contact.A, contact.PartA);
        part_world(part_b2, game2, contact.B, contact.PartB);
        let dx = part_b2[0] - part_a2[0];
        let dy = part_b2[1] - part_a2[1];
        let distance = Math.sqrt(dx * dx + dy * dy);
        let nx, ny;
        if (distance > 1e-4) {
          nx = dx / distance;
          ny = dy / distance;
        } else {
          nx = 0;
          ny = 1;
        }
        let depth = contact.Sum - distance;
        if (depth <= 0) {
          continue;
        }
        let rvx = body_b.Velocity[0] - body_a.Velocity[0];
        let rvy = body_b.Velocity[1] - body_a.Velocity[1];
        let normal_speed = rvx * nx + rvy * ny;
        if (normal_speed < 0) {
          let impulse = -(1 + tuning.Bounce) * normal_speed / inverse_sum;
          body_a.Velocity[0] -= nx * impulse * body_a.InverseMass;
          body_a.Velocity[1] -= ny * impulse * body_a.InverseMass;
          body_b.Velocity[0] += nx * impulse * body_b.InverseMass;
          body_b.Velocity[1] += ny * impulse * body_b.InverseMass;
        }
        let tangent_speed = -rvx * ny + rvy * nx;
        if (tuning.Friction > 0 && iteration === 0) {
          let impulse = -tangent_speed * tuning.Friction / inverse_sum;
          body_a.Velocity[0] += ny * impulse * body_a.InverseMass;
          body_a.Velocity[1] -= nx * impulse * body_a.InverseMass;
          body_b.Velocity[0] -= ny * impulse * body_b.InverseMass;
          body_b.Velocity[1] += nx * impulse * body_b.InverseMass;
        }
        body_a.VelocityAngular -= tangent_speed * tuning.Spin;
        body_b.VelocityAngular -= tangent_speed * tuning.Spin;
        let correction = (depth - SLOP) * CORRECTION / inverse_sum;
        if (correction > 0) {
          let local_a = game2.World.LocalTransform2D[contact.A];
          let local_b = game2.World.LocalTransform2D[contact.B];
          local_a.Translation[0] -= nx * correction * body_a.InverseMass;
          local_a.Translation[1] -= ny * correction * body_a.InverseMass;
          local_b.Translation[0] += nx * correction * body_b.InverseMass;
          local_b.Translation[1] += ny * correction * body_b.InverseMass;
          game2.World.Signature[contact.A] |= 16 /* Dirty */;
          game2.World.Signature[contact.B] |= 16 /* Dirty */;
        }
      }
    }
  }

  // src/systems/sys_resize2d.ts
  var QUERY8 = 2 /* Camera2D */;
  function sys_resize2d(game2, delta) {
    let width = game2.Canvas.clientWidth || window.innerWidth;
    let height = game2.Canvas.clientHeight || window.innerHeight;
    let ratio = Math.min(window.devicePixelRatio || 1, 3);
    if (game2.ViewportWidth != width || game2.ViewportHeight != height || game2.PixelRatio != ratio) {
      game2.ViewportResized = true;
    }
    if (game2.ViewportResized) {
      game2.ViewportWidth = width;
      game2.ViewportHeight = height;
      game2.PixelRatio = ratio;
      game2.Canvas.width = Math.round(width * ratio);
      game2.Canvas.height = Math.round(height * ratio);
      for (let ent = 0; ent < game2.World.Signature.length; ent++) {
        if ((game2.World.Signature[ent] & QUERY8) === QUERY8) {
          update5(game2, ent);
        }
      }
    }
  }
  function update5(game2, entity) {
    let camera = game2.World.Camera2D[entity];
    camera.ViewportWidth = game2.ViewportWidth;
    camera.ViewportHeight = game2.ViewportHeight;
    let projection = camera.Projection;
    let width = game2.ViewportWidth;
    let height = game2.ViewportHeight;
    let guide = Math.min(GUIDE_HEIGHT, height * 0.12);
    let free = Math.max(1, height - guide);
    let radius = Math.max(projection.Radius[0], projection.Radius[1]);
    let scale = Math.min(width, free) / (2 * radius);
    mat2d_from_ortho(projection.Projection, width / (2 * scale), height / (2 * scale));
    projection.Projection[5] = guide / height;
    mat2d_invert(projection.Inverse, projection.Projection);
  }

  // src/systems/sys_scale_by_radius.ts
  var QUERY9 = 128 /* LocalTransform2D */ | 8 /* CollideCircle */ | 256 /* Merge */;
  function sys_scale_by_radius(game2, delta) {
    let tuning = game2.Tuning;
    if (tuning.ScaleCenter === 1 && tuning.ScaleEdge === 1) {
      return;
    }
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY9) === QUERY9) {
        update6(game2, ent);
      }
    }
  }
  function update6(game2, entity) {
    let tuning = game2.Tuning;
    let position = game2.World.LocalTransform2D[entity].Translation;
    let distance = Math.sqrt(position[0] * position[0] + position[1] * position[1]);
    let reach = Math.min(distance / tuning.DeathRadius, 1);
    let factor = scale_at(tuning, reach);
    scale_parts(game2.World.CollideCircle[entity], factor);
  }

  // src/systems/sys_transform2d.ts
  var QUERY_DIRTY = 128 /* LocalTransform2D */ | 1024 /* SpatialNode2D */ | 16 /* Dirty */;
  var QUERY_NODE = 128 /* LocalTransform2D */ | 1024 /* SpatialNode2D */;
  function sys_transform2d(game2, delta) {
    for (let ent = 0; ent < game2.World.Signature.length; ent++) {
      if ((game2.World.Signature[ent] & QUERY_DIRTY) === QUERY_DIRTY) {
        update_spatial_node(game2, ent);
      }
    }
  }
  var world_position = [0, 0];
  function update_spatial_node(game2, entity, parent) {
    game2.World.Signature[entity] &= ~16 /* Dirty */;
    let local = game2.World.LocalTransform2D[entity];
    let node = game2.World.SpatialNode2D[entity];
    mat2d_compose(node.World, local.Translation, local.Rotation * DEG_TO_RAD, local.Scale);
    if (parent !== void 0) {
      node.Parent = parent;
    }
    if (node.Parent !== void 0) {
      let parent_transform = game2.World.SpatialNode2D[node.Parent];
      mat2d_multiply(node.World, parent_transform.World, node.World);
      if (node.IsGyroscope) {
        mat2d_get_translation(world_position, node.World);
        mat2d_compose(node.World, world_position, local.Rotation * DEG_TO_RAD, local.Scale);
      }
    }
    mat2d_invert(node.Self, node.World);
    if (game2.World.Signature[entity] & 4 /* Children */) {
      let children = game2.World.Children[entity];
      for (let i = 0; i < children.Children.length; i++) {
        let child = children.Children[i];
        if ((game2.World.Signature[child] & QUERY_NODE) === QUERY_NODE) {
          update_spatial_node(game2, child, entity);
        }
      }
    }
  }

  // lib/html.ts
  function shift(values) {
    let value = values.shift();
    if (typeof value === "boolean" || value == void 0) {
      return "";
    } else if (Array.isArray(value)) {
      return value.join("");
    } else {
      return value;
    }
  }
  function html(strings, ...values) {
    return strings.reduce((out, cur) => out + shift(values) + cur);
  }

  // src/ui.ts
  var PANEL = `position:absolute;inset:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:clamp(8px,1.8vmin,20px);text-align:center;
    color:#fff;font:600 clamp(16px,2.6vmin,26px)/1.4 system-ui,sans-serif;
    background:#080614cc;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
    padding:max(5vmin,16px);box-sizing:border-box;overflow:hidden`;
  var BUTTON = `padding:clamp(12px,1.4vmin,20px) clamp(32px,4vmin,56px);border-radius:999px;border:0;
    background:#ff9ecd;color:#20123a;cursor:pointer;box-shadow:0 0 3vmin #ff9ecd55;
    font:800 clamp(20px,2.8vmin,30px) system-ui,sans-serif;min-height:52px;min-width:150px`;
  var SAFE_TOP = "max(12px,2vmin,env(safe-area-inset-top))";
  var SAFE_LEFT = "max(14px,2.5vmin,env(safe-area-inset-left))";
  var SAFE_RIGHT = "max(14px,2.5vmin,env(safe-area-inset-right))";
  function clock(seconds) {
    let whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
  }
  function App(game2) {
    if (game2.PlayState === "title") {
      return html`
            <div style="${PANEL}">
                <div
                    style="font:800 clamp(46px,9vmin,104px)/1 system-ui,sans-serif;color:#ff9ecd;
                    text-shadow:0 0 4vmin #ff9ecd66;letter-spacing:-0.02em"
                >
                    Cosmic Merge
                </div>
                <div style="max-width:620px;color:#cfc8ff">
                    Aim the cloud around the ring and release to drop. Two of a kind merge into
                    the next one, all the way up to the Cosmic Unicorn.
                </div>
                <div style="max-width:620px;color:#9f97d0;font-size:0.85em">
                    Sweep before you let go to spin the pile. Don't let it press on the
                    glowing ring for three seconds.
                </div>
                ${game2.BestScore > 0 ? html`<div style="color:#fff3c4">Best ${game2.BestScore}</div>` : ""}
                <button style="${BUTTON};margin-top:1vmin" onclick="play()">Play</button>
            </div>
        `;
    }
    return html`
        <div
            style="position:absolute;top:${SAFE_TOP};left:${SAFE_LEFT};color:#fff;pointer-events:none;
            font:700 clamp(30px,5vmin,58px)/1 system-ui,sans-serif;text-shadow:0 0 1.5vmin #000"
        >
            ${game2.Score}
        </div>
        <div
            style="position:absolute;top:calc(${SAFE_TOP} + clamp(36px,6vmin,68px));left:${SAFE_LEFT};color:#9f97d0;
            pointer-events:none;font:600 clamp(15px,2.4vmin,24px)/1 system-ui,sans-serif"
        >
            Best ${Math.max(game2.BestScore, game2.Score)}${game2.Won ? " ★" : ""}
        </div>
        <div
            style="position:absolute;top:calc(${SAFE_TOP} + 12px);right:calc(${SAFE_RIGHT} + 60px);text-align:right;color:#9f97d0;
            pointer-events:none;font:600 clamp(15px,2.2vmin,23px)/1.2 system-ui,sans-serif"
        >
            ${clock(game2.RunTime)}
        </div>
        ${game2.WinTime > 0 ? html`<div
                  style="position:absolute;top:14vmin;left:0;right:0;text-align:center;pointer-events:none;
                  color:#fff3c4;font:800 clamp(28px,6vmin,68px)/1 system-ui,sans-serif;
                  text-shadow:0 0 3vmin #fff3c4"
              >
                  COSMIC UNICORN!
              </div>` : ""}
        ${game2.PlayState === "over" ? html`<div style="${PANEL}">
                  <div style="font:800 clamp(38px,7vmin,80px)/1 system-ui,sans-serif;color:#ff7a8a">
                      The ring broke
                  </div>
                  <div style="font:800 clamp(44px,8vmin,84px)/1 system-ui,sans-serif">
                      ${game2.Score}
                  </div>
                  ${game2.NewBest ? html`<div style="color:#fff3c4">New best score!</div>` : html`<div style="color:#9f97d0">Best ${game2.BestScore}</div>`}
                  <div style="color:#9f97d0">Time ${clock(game2.RunTime)}</div>
                  <button style="${BUTTON};margin-top:1vmin" onclick="play()">Play again</button>
              </div>` : ""}
    `;
  }

  // src/systems/sys_ui.ts
  var prev;
  function sys_ui(game2, delta) {
    sound_music(game2);
    let next = App(game2);
    if (next !== prev) {
      game2.Ui.innerHTML = prev = next;
    }
  }

  // src/game.ts
  var WORLD_CAPACITY = 1024;
  var GUIDE_HEIGHT = 44;
  var MERGE_COOLDOWN = 0.2;
  var POP_SCALE = 1.35;
  var SHAKE_PER_TIER = 0.012;
  var HITSTOP_SMALL = 2;
  var HITSTOP_BIG = 4;
  var HITSTOP_TIER = 5;
  var BREACH_LIMIT = 3;
  var WIN_BANNER = 3;
  var POP_RING_LIFE = 0.35;
  var SHAKE_DECAY = 0.86;
  var SHAKE_MAX = 0.5;
  var Game8 = class extends Game2D {
    constructor() {
      super(...arguments);
      __publicField(this, "World", new World(WORLD_CAPACITY));
      /** The final game's tuning. */
      __publicField(this, "Tuning", TUNING);
      /** Next music step and its place in the 16-step funk loop. */
      __publicField(this, "MusicNext", 0);
      __publicField(this, "MusicStep", 0);
      /** Touching pairs found this step. Only the first ContactCount entries are live. */
      __publicField(this, "Contacts", []);
      __publicField(this, "ContactCount", 0);
      __publicField(this, "PlayState", "title");
      __publicField(this, "Score", 0);
      __publicField(this, "BestScore", load_best());
      /** PewPlay: the run which just ended beat the old best. */
      __publicField(this, "NewBest", false);
      /** Set when two Cosmic Unicorns meet. Play goes on. */
      __publicField(this, "Won", false);
      /** Seconds left on the win banner. */
      __publicField(this, "WinTime", 0);
      /** How long this run has lasted, in seconds. For judging the modes. */
      __publicField(this, "RunTime", 0);
      /** Seconds the mass has been over the death ring without a break. */
      __publicField(this, "BreachTime", 0);
      /** Fixed steps left to freeze the world. Rendering goes on. */
      __publicField(this, "HitStop", 0);
      /** How far the view is thrown off center, in world units. */
      __publicField(this, "ShakeAmount", 0);
    }
    FixedUpdate(step) {
      if (this.PlayState === "play") {
        sys_control_cloud(this, step);
      }
      if (this.HitStop > 0) {
        this.HitStop--;
        return;
      }
      let sub = this.Tuning.SubSteps;
      let sub_step = step / sub;
      for (let i = 0; i < sub; i++) {
        sys_physics2d_integrate(this, sub_step);
        sys_transform2d(this, sub_step);
        sys_scale_by_radius(this, sub_step);
        sys_collide_circle(this, sub_step);
        sys_physics2d_resolve(this, sub_step);
      }
      sys_merge(this, step);
      sys_transform2d(this, step);
      if (this.PlayState === "play") {
        sys_game_over(this, step);
      }
      sys_animate_pop(this, step);
      sys_lifespan(this, step);
    }
    FrameUpdate(delta) {
      sys_resize2d(this, delta);
      sys_camera2d(this, delta);
      sys_draw(this, delta);
      sys_ui(this, delta);
    }
  };
  function load_best() {
    try {
      return Number(localStorage.getItem("cosmic-merge:best")) || 0;
    } catch {
      return 0;
    }
  }

  // src/scenes/blu_camera.ts
  function blueprint_camera(game2) {
    let radius = camera_radius(game2.Tuning);
    return [spatial_node2d(), local_transform2d(), camera2d([radius, radius])];
  }

  // src/components/com_drop_cloud.ts
  function drop_cloud(next_tier) {
    return (game2, entity) => {
      game2.World.Signature[entity] |= 32 /* DropCloud */;
      game2.World.DropCloud[entity] = {
        Angle: -Math.PI / 2,
        NextTier: next_tier,
        Cooldown: 0,
        Swing: 0
      };
    };
  }

  // src/scenes/blu_cloud.ts
  function blueprint_cloud(game2) {
    return [spatial_node2d(), local_transform2d(), drop_cloud(roll_tier())];
  }

  // src/scenes/blu_star.ts
  var STAR_RADIUS = 0.7;
  function blueprint_star(position) {
    return [
      spatial_node2d(),
      local_transform2d(position),
      collide_circle([0, 0, STAR_RADIUS], 2 /* Star */, 1 /* Element */),
      rigid_body2d(STAR_RADIUS, [0, 0], 0, true)
    ];
  }

  // src/scenes/sce_stage.ts
  function scene_stage(game2) {
    game2.Tuning = TUNING;
    game2.World = new World(game2.World.Capacity);
    game2.Score = 0;
    game2.Won = false;
    game2.WinTime = 0;
    game2.RunTime = 0;
    game2.HitStop = 0;
    game2.MusicNext = 0;
    game2.MusicStep = 0;
    game2.BreachTime = 0;
    instantiate(game2, blueprint_camera(game2));
    instantiate(game2, blueprint_cloud(game2));
    set_seed(5);
    let count = game2.Tuning.DeadStars;
    for (let i = 0; i < count; i++) {
      let angle = i / count * Math.PI * 2 + float(-0.3, 0.3);
      let distance = game2.Tuning.DeathRadius * float(0.42, 0.62);
      instantiate(game2, blueprint_star([Math.cos(angle) * distance, Math.sin(angle) * distance]));
    }
    game2.ViewportResized = true;
    sys_resize2d(game2, 0);
    sys_transform2d(game2, 0);
    sys_camera2d(game2, 0);
  }

  // src/index.ts
  var game = new Game8();
  scene_stage(game);
  game.Start();
  window.addEventListener("pointerdown", () => audio_unlock(game), { passive: true });
  window.addEventListener("keydown", () => audio_unlock(game));
  document.addEventListener("visibilitychange", () => {
    if (!game.Audio) {
      return;
    }
    if (document.hidden) {
      game.Audio.suspend().catch(() => {
      });
    } else {
      game.Audio.resume().catch(() => {
      });
    }
  });
  window.play = () => {
    scene_stage(game);
    game.BestScore = load_best();
    game.PlayState = "play";
    game.InputDelta["Mouse0"] = 0;
    game.InputState["Mouse0"] = 0;
    audio_unlock(game);
  };
  var sound = document.getElementById("sound");
  function show_sound() {
    sound.className = muted ? "muted" : "";
    sound.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
    sound.title = muted ? "Sound off" : "Sound on";
  }
  sound.addEventListener("click", () => {
    audio_unlock(game);
    toggle_mute(game);
    show_sound();
  });
  show_sound();
  window.addEventListener("keydown", (evt) => {
    if ((evt.code === "Enter" || evt.code === "Space") && game.PlayState !== "play") {
      evt.preventDefault();
      window.play();
    }
  });
})();

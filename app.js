const MAX_IMAGES = 10;
const MAX_GRID_IMAGES = 6;
const MAX_WORDS = 70;
const BASE_STORY = { width: 1080, height: 1620 };
const STORY = { width: 1080, height: 1620 };
const DEFAULT_RADIUS = 0;
const BASE_CONTENT = { x: 16, y: 16, w: 1048, h: 1588 };
const FOOTER_LOGO_SRC = "assets/automark-footer-logo.png";
const QR_SRC = "assets/automark-qr.png";

const EXPORT_SIZES = [
  { id: "portrait", label: "Portrait 1080×1620", width: 1080, height: 1620 },
];

const VEHICLE_TYPES = {
  front34: { label: "Front 3/4 Exterior", score: 100 },
  front: { label: "Front Exterior", score: 95 },
  side: { label: "Side Exterior", score: 90 },
  rear: { label: "Rear Exterior", score: 85 },
  interior: { label: "Interior", score: 70 },
  dashboard: { label: "Dashboard", score: 65 },
  seats: { label: "Seats", score: 60 },
  wheel: { label: "Wheel", score: 50 },
  engine: { label: "Engine", score: 45 },
  screen: { label: "Screen", score: 40 },
  logo: { label: "Logo", score: 20 },
  unknown: { label: "Unknown Vehicle Shot", score: 55 },
};

const EXPERT_TYPE_MAP = {
  front34: "front_34_exterior",
  front: "front_exterior",
  side: "side_exterior",
  rear: "rear_exterior",
  interior: "interior",
  dashboard: "dashboard",
  seats: "seats",
  wheel: "wheel",
  engine: "engine",
  screen: "screen",
  logo: "logo",
  unknown: "other",
};

const EXPERT_TO_LOCAL_TYPE = Object.fromEntries(Object.entries(EXPERT_TYPE_MAP).map(([localType, expertType]) => [expertType, localType]));

const PRESENTATION_PRIORITY = {
  front34: 110,
  front: 104,
  side: 96,
  rear: 78,
  interior: 62,
  dashboard: 54,
  seats: 50,
  engine: 42,
  wheel: 38,
  screen: 34,
  unknown: 28,
  logo: 12,
};

const SUPPORT_PRIORITY = {
  front34: 96,
  front: 92,
  side: 90,
  rear: 84,
  interior: 74,
  dashboard: 58,
  seats: 54,
  engine: 46,
  wheel: 42,
  screen: 38,
  unknown: 28,
  logo: 10,
};

const LAYOUTS = {
  layout_1: [{ x: 16, y: 16, w: 1048, h: 1588 }],
  layout_2a: [
    { x: 16, y: 16, w: 1048, h: 1064 },
    { x: 16, y: 1080, w: 1048, h: 524 },
  ],
  layout_3a: [
    { x: 16, y: 16, w: 1048, h: 1064 },
    { x: 16, y: 1080, w: 524, h: 524 },
    { x: 540, y: 1080, w: 524, h: 524 },
  ],
  layout_4a: [
    { x: 16, y: 16, w: 1048, h: 1238.67 },
    { x: 16, y: 1254.67, w: 349.33, h: 349.33 },
    { x: 365.33, y: 1254.67, w: 349.33, h: 349.33 },
    { x: 714.67, y: 1254.67, w: 349.33, h: 349.33 },
  ],
  layout_5a: [
    { x: 16, y: 16, w: 1048, h: 540 },
    { x: 16, y: 556, w: 524, h: 524 },
    { x: 540, y: 556, w: 524, h: 524 },
    { x: 16, y: 1080, w: 524, h: 524 },
    { x: 540, y: 1080, w: 524, h: 524 },
  ],
  layout_6a: [
    { x: 16, y: 16, w: 524, h: 529.33 },
    { x: 540, y: 16, w: 524, h: 529.33 },
    { x: 16, y: 545.33, w: 524, h: 529.33 },
    { x: 540, y: 545.33, w: 524, h: 529.33 },
    { x: 16, y: 1074.67, w: 524, h: 529.33 },
    { x: 540, y: 1074.67, w: 524, h: 529.33 },
  ],
};

const LAYOUT_NAMES = {
  layout_1: "1 صورة، Full Hero",
  layout_2a: "2 صور، Hero فوق",
  layout_3a: "3 صور، Hero + مربعين",
  layout_4a: "4 صور، Hero + 3 مربعات",
  layout_5a: "5 صور، Hero + 4 مربعات",
  layout_6a: "6 صور، 2 × 3",
};

const LAYOUTS_BY_COUNT = {
  1: ["layout_1"],
  2: ["layout_2a"],
  3: ["layout_3a"],
  4: ["layout_4a"],
  5: ["layout_5a"],
  6: ["layout_6a"],
};

const state = {
  images: [],
  caption: "",
  heroId: null,
  manualHeroId: null,
  layoutId: null,
  manualLayoutId: null,
  layoutVariantIndex: 0,
  sizeId: "portrait",
  captionPosition: "bottom",
  uploadSequence: 0,
  manualSort: false,
};

const els = {
  input: document.getElementById("imageInput"),
  dropZone: document.getElementById("dropZone"),
  canvas: document.getElementById("storyCanvas"),
  caption: document.getElementById("captionText"),
  wordCounter: document.getElementById("wordCounter"),
  captionHint: document.getElementById("captionHint"),
  imageCount: document.getElementById("imageCount"),
  analysisList: document.getElementById("analysisList"),
  layoutLabel: document.getElementById("layoutLabel"),
  downloadButton: document.getElementById("downloadButton"),
  clearButton: document.getElementById("clearButton"),
  exportStatus: document.getElementById("exportStatus"),
};

const ctx = els.canvas.getContext("2d");
const footerLogo = new Image();
const footerQr = new Image();
footerLogo.onload = () => updateAll();
footerQr.onload = () => updateAll();
footerLogo.src = FOOTER_LOGO_SRC;
footerQr.src = QR_SRC;

const VehicleAnalyzer = {
  analyze(image, fileName = "") {
    const aspect = image.naturalWidth / image.naturalHeight;
    const quality = this.sampleQuality(image);
    const type = this.detectVehicleType(fileName, aspect, quality);

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      aspect,
      orientation: getOrientation(aspect),
      type,
      focus: quality.focus,
      symmetry: quality.symmetry,
      frontConfidence: getFrontConfidence(aspect, quality.symmetry),
      qualityScore: quality.score,
      verdict: quality.score >= 72 ? "جاهزة للنشر" : quality.score >= 54 ? "مقبولة" : "تحتاج صورة أوضح",
    };
  },

  detectVehicleType(fileName, aspect, quality = null) {
    const name = fileName.toLowerCase();
    if (/3-?4|three|quarter|زاوية|ربع/.test(name)) return "front34";
    if (/front|face|grill|bumper|headlight|امام|أمام|واجهة|كشاف/.test(name)) return "front";
    if (/side|profile|left|right|جنب|جانب|جانبي/.test(name)) return "side";
    if (/rear|back|tail|خلف|خلفية/.test(name)) return "rear";
    if (/dashboard|dash|تابلوه|طبلون/.test(name)) return "dashboard";
    if (/seat|seats|كرسي|كراسي|مقاعد/.test(name)) return "seats";
    if (/interior|inside|cabin|داخل|صالون/.test(name)) return "interior";
    if (/wheel|rim|tyre|tire|جنط|عجلة|كاوتش/.test(name)) return "wheel";
    if (/engine|motor|موتور|محرك/.test(name)) return "engine";
    if (/screen|display|شاشة/.test(name)) return "screen";
    if (/logo|badge|emblem|شعار|علامة/.test(name)) return "logo";
    if (quality && quality.symmetry > 0.72 && aspect > 0.82 && aspect < 1.42) return "front";
    if (quality && quality.symmetry > 0.62 && aspect >= 1.05 && aspect < 1.72) return "front34";
    if (aspect > 1.45) return "side";
    if (aspect > 1.08) return "front34";
    return "unknown";
  },

  sampleQuality(image) {
    const size = 128;
    const sample = document.createElement("canvas");
    sample.width = size;
    sample.height = size;
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(image, 0, 0, size, size);
    const data = sctx.getImageData(0, 0, size, size).data;
    let edgeTotal = 0;
    let edgeCount = 0;
    let luminanceTotal = 0;
    let contrastTotal = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightTotal = 0;
    let symmetryTotal = 0;
    let symmetryCount = 0;

    const luminance = (index) => data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        luminanceTotal += luminance(i);
      }
    }

    const averageLum = luminanceTotal / (size * size);

    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const i = (y * size + x) * 4;
        const l = luminance(i);
        const right = luminance((y * size + x + 1) * 4);
        const below = luminance(((y + 1) * size + x) * 4);
        const edge = Math.abs(l - right) + Math.abs(l - below);
        const centerBias = 1.25 - Math.min(0.85, Math.hypot(x / size - 0.5, y / size - 0.5));
        edgeTotal += edge;
        edgeCount += 2;
        contrastTotal += Math.abs(l - averageLum);
        weightedX += x * edge * centerBias;
        weightedY += y * edge * centerBias;
        weightTotal += edge * centerBias;

        if (x < size / 2) {
          const mirror = (y * size + (size - 1 - x)) * 4;
          symmetryTotal += 1 - Math.abs(l - luminance(mirror)) / 255;
          symmetryCount += 1;
        }
      }
    }

    const sharpness = clamp(edgeTotal / edgeCount / 24, 0, 1);
    const exposure = clamp(1 - Math.abs(averageLum - 136) / 136, 0, 1);
    const contrast = clamp((contrastTotal / (size * size)) / 54, 0, 1);

    return {
      score: Math.round((sharpness * 0.42 + exposure * 0.28 + contrast * 0.3) * 100),
      symmetry: symmetryCount ? symmetryTotal / symmetryCount : 0.5,
      focus: {
        x: weightTotal ? clamp(weightedX / weightTotal / size, 0.24, 0.76) : 0.5,
        y: weightTotal ? clamp(weightedY / weightTotal / size, 0.24, 0.76) : 0.5,
      },
    };
  },
};

const ImageScoringEngine = {
  score(item) {
    const typeScore = VEHICLE_TYPES[item.type].score;
    const resolutionScore = clamp((item.width * item.height) / 2_400_000, 0, 1) * 12;
    const qualityBonus = item.qualityScore * 0.22;
    const frontBonus = item.type === "front" || item.type === "front34" ? item.symmetry * 8 : 0;
    return Math.round(clamp(typeScore + resolutionScore + qualityBonus + frontBonus - 18, 0, 100));
  },

  chooseHero(images) {
    const manual = images.find((item) => item.id === state.manualHeroId);
    if (manual) return manual;
    return [...images].sort((a, b) => this.heroCandidateScore(b) - this.heroCandidateScore(a))[0];
  },

  heroCandidateScore(item) {
    const heroTypePriority = {
      front34: 180,
      front: 170,
      side: 128,
      rear: 70,
      interior: 46,
      dashboard: 34,
      seats: 30,
      engine: 18,
      wheel: 16,
      screen: 14,
      unknown: 12,
      logo: -20,
    };
    const exteriorFit = ["front34", "front"].includes(item.type) ? 34 : item.type === "side" ? 18 : item.type === "rear" ? 4 : -36;
    const detailPenalty = ["wheel", "engine", "screen", "logo", "dashboard", "seats"].includes(item.type) ? 48 : 0;
    const fullCarFit = AutomotivePhotoExpert.getFullCarScore(item) * 0.7;
    const typePriority = heroTypePriority[item.type] ?? heroTypePriority.unknown;
    return item.expert.hero_score * 1.35 + typePriority + item.qualityScore * 0.22 + fullCarFit + exteriorFit - detailPenalty;
  },

  supportCandidateScore(item) {
    const detailPenalty = ["logo", "screen", "wheel", "engine"].includes(item.type) ? 12 : 0;
    const typePriority = SUPPORT_PRIORITY[item.type] || SUPPORT_PRIORITY.unknown;
    return item.expert.hero_score * 0.9 + typePriority + item.qualityScore * 0.18 - detailPenalty;
  },

  getPresentationOrder(images, hero) {
    if (!hero) return [];
    const support = images
      .filter((item) => item.id !== hero.id)
      .sort((a, b) => {
        if (state.manualSort) {
          const rankDiff = (a.manualRank ?? 999) - (b.manualRank ?? 999);
          if (rankDiff !== 0) return rankDiff;
        }
        const scoreDiff = this.supportCandidateScore(b) - this.supportCandidateScore(a);
        if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
        return (a.uploadIndex || 0) - (b.uploadIndex || 0);
      });
    return [hero, ...support];
  },
};

const StorySelectionEngine = {
  select(images) {
    if (!images.length) return [];
    const hero = ImageScoringEngine.chooseHero(images);
    const selected = [];
    const used = new Set();

    const add = (item) => {
      if (!item || used.has(item.id) || selected.length >= MAX_GRID_IMAGES) return false;
      selected.push(item);
      used.add(item.id);
      return true;
    };

    add(hero);
    if (images.length <= 2) return selected;

    const bucketPlan = [
      ["side"],
      ["rear"],
      ["interior"],
      ["dashboard", "screen"],
      ["seats"],
      ["wheel"],
      ["engine"],
      ["front34", "front"],
      ["logo"],
      ["unknown"],
    ];

    bucketPlan.forEach((types) => add(this.bestOfTypes(images, types, used)));

    const remaining = images
      .filter((item) => !used.has(item.id))
      .sort((a, b) => ImageScoringEngine.supportCandidateScore(b) - ImageScoringEngine.supportCandidateScore(a));
    remaining.forEach(add);

    return ImageScoringEngine.getPresentationOrder(selected, hero);
  },

  bestOfTypes(images, types, used) {
    return images
      .filter((item) => types.includes(item.type) && !used.has(item.id))
      .sort((a, b) => ImageScoringEngine.supportCandidateScore(b) - ImageScoringEngine.supportCandidateScore(a))[0];
  },
};

const AutomotivePhotoExpert = {
  analyze(item) {
    const exterior = ["front34", "front", "side", "rear"].includes(item.type);
    const detailPenalty = ["wheel", "engine", "screen", "logo", "dashboard", "seats"].includes(item.type) ? 28 : 0;
    const heroAngleBonus = this.getAngleBonus(item.type);
    const lightingScore = item.qualityScore * 0.22;
    const sharpnessProxy = item.qualityScore * 0.18;
    const fitScore = this.getGridFitScore(item);
    const fullCarScore = exterior ? this.getFullCarScore(item) : 20;
    const clutterPenalty = this.getClutterPenalty(item);
    const darkPenalty = item.qualityScore < 44 ? 12 : 0;

    const heroScore = Math.round(
      clamp(heroAngleBonus + lightingScore + sharpnessProxy + fitScore + fullCarScore - detailPenalty - clutterPenalty - darkPenalty, 0, 100)
    );

    return {
      image_type: EXPERT_TYPE_MAP[item.type] || "other",
      hero_score: heroScore,
      reason: this.reason(item, heroScore, fitScore, fullCarScore, clutterPenalty),
    };
  },

  getAngleBonus(type) {
    return {
      front34: 38,
      front: 35,
      side: 31,
      rear: 24,
      interior: 12,
      dashboard: 8,
      seats: 7,
      wheel: 5,
      engine: 4,
      screen: 3,
      logo: 0,
      unknown: 10,
    }[type] || 5;
  },

  getGridFitScore(item) {
    const aspect = item.aspect;
    if (aspect >= 1.12 && aspect <= 1.9) return 18;
    if (aspect >= 0.88 && aspect < 1.12) return 13;
    if (aspect >= 0.66 && aspect < 0.88) return 8;
    return 5;
  },

  getFullCarScore(item) {
    const centered = 1 - Math.min(1, Math.hypot(item.focus.x - 0.5, item.focus.y - 0.52) * 2.1);
    const aspectVisible = item.aspect > 1.05 && item.aspect < 2.05 ? 1 : item.aspect > 0.82 && item.aspect <= 1.05 ? 0.75 : 0.45;
    return Math.round((centered * 0.38 + aspectVisible * 0.42 + item.symmetry * 0.2) * 26);
  },

  getClutterPenalty(item) {
    const offCenter = Math.hypot(item.focus.x - 0.5, item.focus.y - 0.52);
    const noisyButNotSharp = item.qualityScore < 58 && item.symmetry < 0.55;
    return Math.round(offCenter * 12 + (noisyButNotSharp ? 8 : 0));
  },

  reason(item, heroScore, fitScore, fullCarScore, clutterPenalty) {
    const typeLabel = VEHICLE_TYPES[item.type].label;
    if (item.type === "front34") return `${typeLabel} is the strongest hero candidate with a flattering angle, good grid fit, and visible vehicle shape.`;
    if (item.type === "front") return `${typeLabel} scores highly because the car is frontal, balanced, and suitable for a dominant hero slot.`;
    if (item.type === "side") return `${typeLabel} is usable as hero when the full profile is clear and fits the portrait grid well.`;
    if (["wheel", "engine", "screen", "logo", "dashboard", "seats"].includes(item.type)) {
      return `${typeLabel} is a detail shot, useful as support but penalized for hero use.`;
    }
    if (heroScore < 55 || clutterPenalty > 8) return `${typeLabel} is acceptable but weaker because the car framing, lighting, or background clarity is not ideal.`;
    return `${typeLabel} has a fair hero score with ${fitScore}/18 grid fit and ${fullCarScore}/26 full-car visibility.`;
  },
};

const LayoutSelector = {
  select(images) {
    const validLayouts = this.getValidLayouts(images.length);
    if (validLayouts.includes(state.manualLayoutId)) return state.manualLayoutId;

    const n = images.length;
    if (n === 1) return "layout_1";
    if (n === 2) return "layout_2a";
    if (n === 3) return "layout_3a";
    if (n === 4) return "layout_4a";
    if (n === 5) return "layout_5a";
    return "layout_6a";
  },

  getValidLayouts(count) {
    return LAYOUTS_BY_COUNT[count] || [];
  },

  nextLayout(count) {
    const validLayouts = this.getValidLayouts(count);
    if (!validLayouts.length) return null;
    const currentIndex = validLayouts.indexOf(state.layoutId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % validLayouts.length : state.layoutVariantIndex % validLayouts.length;
    state.layoutVariantIndex = nextIndex;
    state.manualLayoutId = validLayouts[nextIndex];
    return state.manualLayoutId;
  },
};

const SmartCropEngine = {
  getSourceRect(item, slot) {
    const image = item.image;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const slotRatio = slot.w / slot.h;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (imageRatio > slotRatio) {
      sw = image.naturalHeight * slotRatio;
      sx = (image.naturalWidth - sw) * item.focus.x;
    } else {
      sh = image.naturalWidth / slotRatio;
      sy = (image.naturalHeight - sh) * item.focus.y;
    }

    sx = clamp(sx, 0, image.naturalWidth - sw);
    sy = clamp(sy, 0, image.naturalHeight - sh);

    return { sx, sy, sw, sh };
  },
};

const Renderer = {
  render() {
    if (!state.images.length) {
      state.heroId = null;
      state.layoutId = null;
      this.empty();
      return;
    }

    const selectedImages = StorySelectionEngine.select(state.images);
    const hero = selectedImages[0];
    state.heroId = hero.id;
    state.layoutId = LayoutSelector.select(selectedImages);
    const ordered = selectedImages;
    const captionBand = this.getCaptionBand(state.caption);
    const slots = this.getScaledSlots(LAYOUTS[state.layoutId], captionBand);

    ctx.clearRect(0, 0, STORY.width, STORY.height);
    this.background();
    slots.forEach((slot, index) => this.imageSlot(ordered[index], slot));
    this.footerAssets(slots, captionBand);
    if (captionBand) this.caption(state.caption, captionBand);
  },

  background() {
    ctx.fillStyle = "#fbfaf8";
    ctx.fillRect(0, 0, STORY.width, STORY.height);
  },

  empty() {
    ctx.fillStyle = "#fbfaf8";
    ctx.fillRect(0, 0, STORY.width, STORY.height);
    ctx.fillStyle = "rgba(22, 20, 18, 0.82)";
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.font = "700 54px -apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, sans-serif";
    ctx.fillText("AutoMark Story Generator", STORY.width / 2, STORY.height / 2 - 20);
    ctx.font = "400 30px -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif";
    ctx.fillText("ارفع حتى 10 صور والسيستم يختار أفضل صور للبيع", STORY.width / 2, STORY.height / 2 + 38);
  },

  imageSlot(item, slot) {
    if (!item) return;
    ctx.save();
    roundedPath(slot.x, slot.y, slot.w, slot.h, DEFAULT_RADIUS);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.clip();

    const source = SmartCropEngine.getSourceRect(item, slot);
    ctx.drawImage(item.image, source.sx, source.sy, source.sw, source.sh, slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
  },

  footerAssets(slots, captionBand) {
    if (!slots.length) return;
    const imageAreaBottom = captionBand ? captionBand.y : Math.max(...slots.map((slot) => slot.y + slot.h));
    const pad = Math.round(STORY.width * 0.035);
    const baselineY = imageAreaBottom - pad;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    if (footerQr.complete && footerQr.naturalWidth) {
      const qrSize = Math.round(STORY.width * 0.145);
      ctx.drawImage(footerQr, pad, baselineY - qrSize, qrSize, qrSize);
    }

    if (footerLogo.complete && footerLogo.naturalWidth) {
      const maxLogoW = Math.round(STORY.width * 0.34);
      const maxLogoH = Math.round(STORY.height * 0.07);
      const logoRatio = footerLogo.naturalWidth / footerLogo.naturalHeight;
      let logoW = maxLogoW;
      let logoH = logoW / logoRatio;
      if (logoH > maxLogoH) {
        logoH = maxLogoH;
        logoW = logoH * logoRatio;
      }
      ctx.drawImage(footerLogo, STORY.width - logoW - pad, pad, logoW, logoH);
    }

    ctx.restore();
  },

  getCaptionBand(text) {
    if (!text || state.captionPosition === "none") return null;
    const maxHeight = Math.round(STORY.height / 3);
    const minHeight = Math.round(STORY.height * 0.14);
    const paddingX = Math.round(STORY.width * 0.045);
    let paddingY = Math.round(maxHeight * 0.07);
    const maxWidth = STORY.width - paddingX * 2;
    const maxTextHeight = maxHeight - paddingY * 2;
    let fontSize = Math.max(26, Math.round(STORY.width * 0.04));
    let lines = wrapCanvasText(text, maxWidth, fontSize, "650");
    while (fontSize > 24 && lines.length * (fontSize + 11) > maxTextHeight) {
      fontSize -= 2;
      lines = wrapCanvasText(text, maxWidth, fontSize, "650");
    }
    const maxLines = Math.max(1, Math.floor(maxTextHeight / (fontSize + 11)));
    lines = lines.slice(0, maxLines);
    const lineHeight = fontSize + 11;
    const naturalHeight = lines.length * lineHeight + paddingY * 2;
    const height = clamp(naturalHeight, minHeight, maxHeight);
    paddingY = Math.max(28, Math.round((height - lines.length * lineHeight) / 2));
    return {
      x: 0,
      y: STORY.height - height,
      w: STORY.width,
      h: height,
      paddingX,
      paddingY,
      lines,
      fontSize,
      lineHeight,
      position: "bottom",
    };
  },

  getScaledSlots(baseSlots, captionBand) {
    const sx = STORY.width / BASE_STORY.width;
    const sy = STORY.height / BASE_STORY.height;
    const marginX = 0;
    const marginY = 0;
    const reserved = captionBand ? captionBand.h : 0;
    const yOffset = captionBand?.position === "top" ? reserved : 0;
    const area = {
      x: marginX,
      y: marginY + yOffset,
      w: STORY.width - marginX * 2,
      h: STORY.height - marginY * 2 - reserved,
    };

    return baseSlots.map((slot) => {
      const rx = (slot.x - BASE_CONTENT.x) / BASE_CONTENT.w;
      const ry = (slot.y - BASE_CONTENT.y) / BASE_CONTENT.h;
      return {
        x: area.x + rx * area.w,
        y: area.y + ry * area.h,
        w: (slot.w / BASE_CONTENT.w) * area.w,
        h: (slot.h / BASE_CONTENT.h) * area.h,
      };
    });
  },

  caption(text, band) {
    const lines = band.lines;
    const boxX = band.x;
    const boxY = band.y;
    const boxW = band.w;
    const boxH = band.h;

    ctx.save();
    roundedPath(boxX, boxY, boxW, boxH, 0);
    ctx.fillStyle = "rgba(7, 7, 7, 1)";
    ctx.fill();

    ctx.fillStyle = "rgba(250, 250, 248, 0.96)";
    ctx.direction = containsArabic(text) ? "rtl" : "ltr";
    ctx.textAlign = containsArabic(text) ? "right" : "left";
    ctx.font = `650 ${band.fontSize}px -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif`;
    const textPadX = Math.max(28, Math.round(band.paddingX * 0.72));
    const x = containsArabic(text) ? boxX + boxW - textPadX : boxX + textPadX;
    const firstBaseline = boxY + band.paddingY + band.fontSize;
    lines.forEach((line, index) => {
      ctx.fillText(line, x, firstBaseline + index * band.lineHeight);
    });
    ctx.restore();
  },
};

const QualityValidator = {
  validate(images) {
    if (!images.length) return "في انتظار الصور";
    if (images.some((item) => item.width < 700 || item.height < 700)) return "بعض الصور دقتها قليلة";
    return "جاهز للتصدير";
  },
};

const ExportEngine = {
  download() {
    if (!state.images.length) return;
    Renderer.render();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `automark-story-${STORY.width}x${STORY.height}-${timestamp}.png`;
    this.clickDownload(els.canvas.toDataURL("image/png"), filename);
    this.setStatus("تم تجهيز الصورة للتحميل.");
  },

  clickDownload(href, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = href;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  setStatus(message) {
    if (!els.exportStatus) return;
    els.exportStatus.textContent = message;
  },
};

els.input.addEventListener("change", (event) => addFiles(event.target.files));
els.caption.addEventListener("input", handleCaptionInput);
els.downloadButton.addEventListener("click", () => {
  ExportEngine.download();
});
els.clearButton.addEventListener("click", clearAll);
els.analysisList.addEventListener("click", handleAnalysisClick);
els.analysisList.addEventListener("change", handleAnalysisChange);

["dragenter", "dragover"].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((type) => {
  els.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("is-dragging");
  });
});

els.dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

updateCanvasSize();
updateAll();
if (new URLSearchParams(window.location.search).get("demo") === "1") {
  loadDemoImages();
}

async function addFiles(fileList) {
  const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
  const selected = imageFiles.slice(0, Math.max(0, MAX_IMAGES - state.images.length));
  if (selected.length) state.manualSort = false;

  for (const file of selected) {
    const image = await loadImage(file);
    const analyzed = VehicleAnalyzer.analyze(image, file.name);
    const item = {
      id: createId(),
      file,
      name: file.name,
      image,
      url: URL.createObjectURL(file),
      analysisSource: "rules",
      uploadIndex: state.uploadSequence++,
      ...analyzed,
    };
    item.score = ImageScoringEngine.score(item);
    item.expert = AutomotivePhotoExpert.analyze(item);
    item.score = item.expert.hero_score;
    state.images.push(item);
  }

  els.input.value = "";
  updateAll();
}

async function loadDemoImages() {
  if (state.images.length) return;

  const demos = [
    { name: "front-34-exterior.jpg", w: 1500, h: 980, color: "#b91c1c", label: "Front 3/4" },
    { name: "side-exterior.jpg", w: 1500, h: 900, color: "#7f1d1d", label: "Side" },
    { name: "rear-exterior.jpg", w: 1300, h: 900, color: "#a16207", label: "Rear" },
    { name: "interior.jpg", w: 1200, h: 1000, color: "#57534e", label: "Interior" },
    { name: "wheel-detail.jpg", w: 980, h: 980, color: "#292524", label: "Wheel" },
    { name: "dashboard.jpg", w: 1200, h: 850, color: "#44403c", label: "Dash" },
  ];

  for (const demo of demos) {
    const image = await loadImageFromDataUrl(makeDemoSvg(demo));
    const analyzed = VehicleAnalyzer.analyze(image, demo.name);
    const item = {
      id: createId(),
      file: null,
      name: demo.name,
      image,
      url: image.src,
      analysisSource: "rules",
      uploadIndex: state.uploadSequence++,
      ...analyzed,
    };
    item.score = ImageScoringEngine.score(item);
    item.expert = AutomotivePhotoExpert.analyze(item);
    item.score = item.expert.hero_score;
    state.images.push(item);
  }

  updateAll();
}

function makeDemoSvg({ w, h, color, label }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="${color}" offset="0"/>
          <stop stop-color="#f6efe9" offset="1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="${w * 0.35}" ry="${h * 0.18}" fill="rgba(20,20,20,.24)"/>
      <circle cx="${w * 0.34}" cy="${h * 0.68}" r="${Math.min(w, h) * 0.065}" fill="rgba(20,20,20,.42)"/>
      <circle cx="${w * 0.68}" cy="${h * 0.68}" r="${Math.min(w, h) * 0.065}" fill="rgba(20,20,20,.42)"/>
      <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" fill="#171412" font-family="Arial" font-size="${Math.max(44, w / 12)}" font-weight="700">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function updateAll() {
  normalizeStateForImageCount();
  Renderer.render();
  renderAnalysis();

  const selectedCount = StorySelectionEngine.select(state.images).length;
  els.imageCount.textContent = `${state.images.length} مرفوعة، ${selectedCount} في التصميم`;
  els.wordCounter.textContent = `${getWords(state.caption).length} من ${MAX_WORDS} كلمة`;
  els.layoutLabel.textContent = state.layoutId ? LAYOUT_NAMES[state.layoutId] : QualityValidator.validate(state.images);
  els.downloadButton.disabled = state.images.length === 0;
  els.clearButton.disabled = state.images.length === 0 && !state.caption;
  if (!state.images.length && els.exportStatus) els.exportStatus.textContent = "";
}

function updateCanvasSize() {
  const size = EXPORT_SIZES.find((item) => item.id === state.sizeId) || EXPORT_SIZES[0];
  STORY.width = size.width;
  STORY.height = size.height;
  els.canvas.width = size.width;
  els.canvas.height = size.height;
  els.canvas.closest(".phone-frame").style.aspectRatio = `${size.width} / ${size.height}`;
}

function renderAnalysis() {
  if (!state.images.length) {
    els.analysisList.innerHTML = '<p class="empty-state">ارفع حتى 10 صور. السيستم يختار هيرو أمامي أو جانبي، ثم يكمل التصميم بأهم زوايا وتفاصيل السيارة.</p>';
    return;
  }

  els.analysisList.innerHTML = "";
  const selectedImages = StorySelectionEngine.select(state.images);
  const selectedIds = new Set(selectedImages.map((item) => item.id));
  const orderedImages = [
    ...selectedImages,
    ...state.images
      .filter((item) => !selectedIds.has(item.id))
      .sort((a, b) => ImageScoringEngine.supportCandidateScore(b) - ImageScoringEngine.supportCandidateScore(a)),
  ];
  orderedImages.forEach((item, index) => {
    const isSelected = selectedIds.has(item.id);
    const selectedIndex = selectedImages.findIndex((image) => image.id === item.id);
    const card = document.createElement("article");
    card.className = `analysis-card ${isSelected ? "is-selected" : "is-muted"}`;
    card.innerHTML = `
      <img src="${item.url}" alt="">
      <div class="analysis-meta">
        <strong>${item.id === state.heroId ? "Hero" : isSelected ? `#${selectedIndex + 1}` : "احتياطي"}</strong>
        <span>Hero ${item.expert.hero_score}%</span>
      </div>
      <div class="image-actions">
        <button class="pin-button ${item.id === state.manualHeroId ? "is-active" : ""}" data-action="hero" data-id="${item.id}" type="button" aria-label="اجعل الصورة Hero">Hero</button>
        <button class="delete-button" data-action="delete" data-id="${item.id}" type="button" aria-label="حذف الصورة">حذف</button>
        <button class="icon-button" data-action="up" data-id="${item.id}" type="button" aria-label="حرك الصورة للأعلى" ${!isSelected || selectedIndex <= 1 ? "disabled" : ""}>↑</button>
        <button class="icon-button" data-action="down" data-id="${item.id}" type="button" aria-label="حرك الصورة للأسفل" ${!isSelected || selectedIndex < 1 || selectedIndex >= selectedImages.length - 1 ? "disabled" : ""}>↓</button>
      </div>
    `;
    els.analysisList.appendChild(card);
  });
}

function handleAnalysisClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const index = state.images.findIndex((item) => item.id === button.dataset.id);
  if (index < 0) return;

  if (button.dataset.action === "hero") {
    state.manualHeroId = button.dataset.id;
    updateAll();
    return;
  }

  if (button.dataset.action === "delete") {
    removeImage(button.dataset.id);
    return;
  }

  const ordered = StorySelectionEngine.select(state.images);
  const displayIndex = ordered.findIndex((item) => item.id === button.dataset.id);
  const next = displayIndex + (button.dataset.action === "up" ? -1 : 1);
  if (next <= 0 || next >= ordered.length) return;
  [ordered[displayIndex], ordered[next]] = [ordered[next], ordered[displayIndex]];
  ordered.forEach((item, rank) => {
    item.manualRank = rank;
  });
  state.manualSort = true;
  updateAll();
}

function removeImage(id) {
  const item = state.images.find((image) => image.id === id);
  if (item?.file) URL.revokeObjectURL(item.url);
  state.images = state.images.filter((image) => image.id !== id);

  if (state.manualHeroId === id) state.manualHeroId = null;
  if (state.heroId === id) state.heroId = null;
  if (!LayoutSelector.getValidLayouts(StorySelectionEngine.select(state.images).length).includes(state.manualLayoutId)) {
    state.manualLayoutId = null;
  }

  updateAll();
}

function normalizeStateForImageCount() {
  if (!LayoutSelector.getValidLayouts(StorySelectionEngine.select(state.images).length).includes(state.manualLayoutId)) {
    state.manualLayoutId = null;
  }
}

function handleAnalysisChange(event) {
  const select = event.target.closest("select[data-action='type']");
  if (!select) return;
  const item = state.images.find((image) => image.id === select.dataset.id);
  if (!item) return;
  item.type = select.value;
  item.score = ImageScoringEngine.score(item);
  item.expert = AutomotivePhotoExpert.analyze(item);
  item.analysisSource = "manual";
  item.score = item.expert.hero_score;
  updateAll();
}

function handleCaptionInput() {
  const words = getWords(els.caption.value);
  if (words.length > MAX_WORDS) {
    els.caption.value = words.slice(0, MAX_WORDS).join(" ");
    els.captionHint.textContent = "تم إيقاف النص عند 70 كلمة.";
  } else {
    els.captionHint.textContent = "يظهر داخل الصورة النهائية. آخر حد 70 كلمة.";
  }
  state.caption = els.caption.value.trim();
  updateAll();
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}

function loadImageFromDataUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function getHeroIndex() {
  return state.images.findIndex((item) => item.id === state.heroId);
}

function getOrientation(aspect) {
  if (aspect > 1.12) return "landscape";
  if (aspect < 0.88) return "portrait";
  return "square";
}

function getFrontConfidence(aspect, symmetry) {
  const aspectFit = aspect > 0.82 && aspect < 1.42 ? 1 : aspect > 1.42 && aspect < 1.78 ? 0.62 : 0.32;
  return Math.round(clamp(symmetry * 0.78 + aspectFit * 0.22, 0, 1) * 100);
}

function clearAll() {
  state.images.forEach((item) => {
    if (item.file) URL.revokeObjectURL(item.url);
  });
  state.images = [];
  state.caption = "";
  state.heroId = null;
  state.manualHeroId = null;
  state.layoutId = null;
  state.manualSort = false;
  state.uploadSequence = 0;
  els.caption.value = "";
  updateAll();
}

function roundedPath(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function getWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function wrapCanvasText(text, maxWidth, fontSize, weight = "500") {
  ctx.save();
  ctx.font = `${weight} ${fontSize}px -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif`;
  const words = getWords(text);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  ctx.restore();
  return lines;
}

function containsArabic(text) {
  return /[\u0600-\u06ff]/.test(text);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

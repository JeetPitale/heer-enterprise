// autoColorEngine.js — Dynamic palette based on skin tone + undertone

// Warm undertone: golden, earthy, warm-toned colors
const WARM_PALETTES = {
  "Very Fair": [
    { id: "peach", name: "Peach", hex: "#FFDAB9" },
    { id: "coral", name: "Coral", hex: "#FF7F50" },
    { id: "warm-gold", name: "Warm Gold", hex: "#DAA520" },
    { id: "terracotta", name: "Terracotta", hex: "#CC5A3B" },
    { id: "olive-green", name: "Olive Green", hex: "#6B8E23" },
    { id: "camel", name: "Camel", hex: "#C19A6B" },
    { id: "ivory", name: "Ivory", hex: "#FFFFF0" },
    { id: "rust", name: "Rust", hex: "#B7410E" },
  ],
  "Fair": [
    { id: "salmon", name: "Salmon", hex: "#FA8072" },
    { id: "amber", name: "Amber", hex: "#FFBF00" },
    { id: "warm-brown", name: "Warm Brown", hex: "#8B4513" },
    { id: "burnt-orange", name: "Burnt Orange", hex: "#CC5500" },
    { id: "moss-green", name: "Moss Green", hex: "#8A9A5B" },
    { id: "golden-yellow", name: "Golden Yellow", hex: "#F4D35E" },
    { id: "cream", name: "Cream", hex: "#FFFDD0" },
    { id: "bronze", name: "Bronze", hex: "#CD7F32" },
  ],
  "Medium": [
    { id: "mustard", name: "Mustard", hex: "#E1AD01" },
    { id: "burnt-sienna", name: "Burnt Sienna", hex: "#E97451" },
    { id: "olive", name: "Olive", hex: "#808000" },
    { id: "warm-red", name: "Warm Red", hex: "#CC3333" },
    { id: "teal", name: "Teal", hex: "#008080" },
    { id: "chocolate", name: "Chocolate", hex: "#7B3F00" },
    { id: "tangerine", name: "Tangerine", hex: "#FF9966" },
    { id: "khaki", name: "Khaki", hex: "#C3B091" },
  ],
  "Olive": [
    { id: "deep-coral", name: "Deep Coral", hex: "#E55B3C" },
    { id: "golden-brown", name: "Golden Brown", hex: "#996515" },
    { id: "warm-plum", name: "Warm Plum", hex: "#8E4585" },
    { id: "saffron", name: "Saffron", hex: "#F4C430" },
    { id: "cinnamon", name: "Cinnamon", hex: "#D2691E" },
    { id: "forest-green", name: "Forest Green", hex: "#228B22" },
    { id: "copper", name: "Copper", hex: "#B87333" },
    { id: "deep-red", name: "Deep Red", hex: "#8B0000" },
  ],
  "Dark": [
    { id: "bright-orange", name: "Bright Orange", hex: "#FF6600" },
    { id: "rich-gold", name: "Rich Gold", hex: "#FFD700" },
    { id: "deep-teal", name: "Deep Teal", hex: "#005F5F" },
    { id: "magenta", name: "Magenta", hex: "#CC0066" },
    { id: "cobalt-blue", name: "Cobalt Blue", hex: "#0047AB" },
    { id: "emerald", name: "Emerald", hex: "#50C878" },
    { id: "cream", name: "Cream", hex: "#FFFDD0" },
    { id: "mango", name: "Mango", hex: "#FF8243" },
  ],
};

// Cool undertone: blue-based, jewel-toned colors
const COOL_PALETTES = {
  "Very Fair": [
    { id: "lavender", name: "Lavender", hex: "#B57EDC" },
    { id: "rose-pink", name: "Rose Pink", hex: "#FF66B2" },
    { id: "powder-blue", name: "Powder Blue", hex: "#B0E0E6" },
    { id: "cool-grey", name: "Cool Grey", hex: "#8C92AC" },
    { id: "soft-plum", name: "Soft Plum", hex: "#9B59B6" },
    { id: "icy-blue", name: "Icy Blue", hex: "#A5F2F3" },
    { id: "dove-white", name: "Dove White", hex: "#F5F5F5" },
    { id: "mauve", name: "Mauve", hex: "#E0B0FF" },
  ],
  "Fair": [
    { id: "royal-blue", name: "Royal Blue", hex: "#4169E1" },
    { id: "raspberry", name: "Raspberry", hex: "#E30B5C" },
    { id: "emerald", name: "Emerald", hex: "#50C878" },
    { id: "slate-grey", name: "Slate Grey", hex: "#708090" },
    { id: "deep-plum", name: "Deep Plum", hex: "#5C1A5C" },
    { id: "periwinkle", name: "Periwinkle", hex: "#CCCCFF" },
    { id: "cherry", name: "Cherry", hex: "#DE3163" },
    { id: "navy", name: "Navy", hex: "#000080" },
  ],
  "Medium": [
    { id: "sapphire", name: "Sapphire", hex: "#0F52BA" },
    { id: "berry", name: "Berry", hex: "#8E4585" },
    { id: "jade", name: "Jade", hex: "#00A86B" },
    { id: "cool-pink", name: "Cool Pink", hex: "#F28482" },
    { id: "charcoal", name: "Charcoal", hex: "#36454F" },
    { id: "wine", name: "Wine", hex: "#722F37" },
    { id: "teal-blue", name: "Teal Blue", hex: "#367588" },
    { id: "fuchsia", name: "Fuchsia", hex: "#FF00FF" },
  ],
  "Olive": [
    { id: "deep-navy", name: "Deep Navy", hex: "#0A0A3C" },
    { id: "plum", name: "Plum", hex: "#8E4585" },
    { id: "teal-green", name: "Teal Green", hex: "#2A9D8F" },
    { id: "burgundy", name: "Burgundy", hex: "#800020" },
    { id: "steel-blue", name: "Steel Blue", hex: "#457B9D" },
    { id: "orchid", name: "Orchid", hex: "#DA70D6" },
    { id: "evergreen", name: "Evergreen", hex: "#00573F" },
    { id: "cool-taupe", name: "Cool Taupe", hex: "#8B8589" },
  ],
  "Dark": [
    { id: "electric-blue", name: "Electric Blue", hex: "#0892D0" },
    { id: "hot-pink", name: "Hot Pink", hex: "#FF69B4" },
    { id: "bright-white", name: "Bright White", hex: "#FFFFFF" },
    { id: "violet", name: "Violet", hex: "#7F00FF" },
    { id: "turquoise", name: "Turquoise", hex: "#40E0D0" },
    { id: "ruby", name: "Ruby", hex: "#E0115F" },
    { id: "silver", name: "Silver", hex: "#C0C0C0" },
    { id: "amethyst", name: "Amethyst", hex: "#9966CC" },
  ],
};

// Neutral undertone: mix of warm and cool
const NEUTRAL_PALETTES = {
  "Very Fair": [
    { id: "dusty-rose", name: "Dusty Rose", hex: "#DCAE96" },
    { id: "sage", name: "Sage", hex: "#B2AC88" },
    { id: "soft-teal", name: "Soft Teal", hex: "#5F9EA0" },
    { id: "blush", name: "Blush", hex: "#DE5D83" },
    { id: "stone", name: "Stone", hex: "#918B76" },
    { id: "dusty-blue", name: "Dusty Blue", hex: "#6699CC" },
    { id: "off-white", name: "Off White", hex: "#FAF0E6" },
    { id: "soft-coral", name: "Soft Coral", hex: "#F08080" },
  ],
  "Fair": [
    { id: "jade-green", name: "Jade Green", hex: "#00A86B" },
    { id: "rose-wood", name: "Rosewood", hex: "#65000B" },
    { id: "sky-blue", name: "Sky Blue", hex: "#87CEEB" },
    { id: "warm-taupe", name: "Warm Taupe", hex: "#967969" },
    { id: "soft-gold", name: "Soft Gold", hex: "#CFB53B" },
    { id: "mauve-pink", name: "Mauve Pink", hex: "#C8A2C8" },
    { id: "denim", name: "Denim", hex: "#1560BD" },
    { id: "sand", name: "Sand", hex: "#C2B280" },
  ],
  "Medium": [
    { id: "olive-green", name: "Olive Green", hex: "#6B8E23" },
    { id: "brick-red", name: "Brick Red", hex: "#CB4154" },
    { id: "medium-blue", name: "Medium Blue", hex: "#0000CD" },
    { id: "bronze", name: "Bronze", hex: "#CD7F32" },
    { id: "forest", name: "Forest", hex: "#228B22" },
    { id: "dusty-purple", name: "Dusty Purple", hex: "#7E5F7F" },
    { id: "cognac", name: "Cognac", hex: "#9F381D" },
    { id: "grey-blue", name: "Grey Blue", hex: "#6D819C" },
  ],
  "Olive": [
    { id: "pine-green", name: "Pine Green", hex: "#01796F" },
    { id: "maroon", name: "Maroon", hex: "#800000" },
    { id: "midnight-blue", name: "Midnight Blue", hex: "#191970" },
    { id: "mustard", name: "Mustard", hex: "#E1AD01" },
    { id: "aubergine", name: "Aubergine", hex: "#693B58" },
    { id: "teal", name: "Teal", hex: "#008080" },
    { id: "caramel", name: "Caramel", hex: "#FFD59A" },
    { id: "charcoal", name: "Charcoal", hex: "#36454F" },
  ],
  "Dark": [
    { id: "bright-coral", name: "Bright Coral", hex: "#FF6F61" },
    { id: "royal-purple", name: "Royal Purple", hex: "#7851A9" },
    { id: "pure-white", name: "Pure White", hex: "#FFFFFF" },
    { id: "gold", name: "Gold", hex: "#FFD700" },
    { id: "teal", name: "Teal", hex: "#008080" },
    { id: "crimson", name: "Crimson", hex: "#DC143C" },
    { id: "cobalt", name: "Cobalt", hex: "#0047AB" },
    { id: "silver", name: "Silver", hex: "#C0C0C0" },
  ],
};

export const generatePalette = (skinTone, undertone) => {
  // Normalize inputs
  const tone = skinTone || "Medium";
  const ut = (undertone || "neutral").toLowerCase();

  let palettes;
  if (ut === "warm") {
    palettes = WARM_PALETTES;
  } else if (ut === "cool") {
    palettes = COOL_PALETTES;
  } else {
    palettes = NEUTRAL_PALETTES;
  }

  // Match skin tone with fallbacks
  return palettes[tone] || palettes["Dark"] || palettes["Medium"];
};

// Maps palette color IDs to product catalog color IDs
const COLOR_FAMILY_MAP = {
  // Reds / Pinks
  "coral": ["red", "orange", "pink"],
  "deep-coral": ["red", "orange"],
  "warm-red": ["red"],
  "deep-red": ["red"],
  "rust": ["red", "orange", "brown"],
  "terracotta": ["red", "orange", "brown"],
  "burnt-sienna": ["red", "orange"],
  "salmon": ["red", "pink", "orange"],
  "cherry": ["red", "pink"],
  "raspberry": ["red", "pink"],
  "ruby": ["red", "pink"],
  "crimson": ["red"],
  "berry": ["red", "purple", "pink"],
  "wine": ["red", "purple"],
  "burgundy": ["red", "brown"],
  "maroon": ["red", "brown"],
  "magenta": ["pink", "red"],
  "hot-pink": ["pink"],
  "rose-pink": ["pink"],
  "cool-pink": ["pink"],
  "fuchsia": ["pink", "purple"],
  "brick-red": ["red", "brown"],
  "bright-coral": ["red", "orange", "pink"],

  // Oranges / Browns
  "burnt-orange": ["orange", "brown"],
  "bright-orange": ["orange"],
  "tangerine": ["orange"],
  "mango": ["orange"],
  "peach": ["orange", "pink", "cream"],
  "cinnamon": ["brown", "orange"],
  "chocolate": ["brown"],
  "warm-brown": ["brown"],
  "golden-brown": ["brown", "gold"],
  "bronze": ["brown", "gold"],
  "copper": ["brown", "orange", "gold"],
  "camel": ["brown", "cream"],
  "cognac": ["brown", "red"],
  "caramel": ["brown", "gold", "cream"],
  "rosewood": ["brown", "red"],
  "rose-wood": ["brown", "red"],

  // Yellows / Golds
  "golden-yellow": ["yellow", "gold"],
  "mustard": ["yellow", "gold"],
  "saffron": ["yellow", "gold"],
  "amber": ["yellow", "gold", "orange"],
  "warm-gold": ["gold"],
  "rich-gold": ["gold"],
  "soft-gold": ["gold"],
  "gold": ["gold"],

  // Greens
  "olive-green": ["green"],
  "olive": ["green"],
  "moss-green": ["green"],
  "forest-green": ["green"],
  "forest": ["green"],
  "emerald": ["green", "teal"],
  "jade": ["green", "teal"],
  "jade-green": ["green", "teal"],
  "pine-green": ["green", "teal"],
  "sage": ["green"],
  "evergreen": ["green"],

  // Blues / Teals
  "teal": ["teal"],
  "teal-green": ["teal", "green"],
  "teal-blue": ["teal", "blue"],
  "soft-teal": ["teal"],
  "deep-teal": ["teal"],
  "steel-blue": ["blue"],
  "royal-blue": ["blue"],
  "sapphire": ["blue", "indigo"],
  "cobalt-blue": ["blue", "indigo"],
  "cobalt": ["blue", "indigo"],
  "electric-blue": ["blue"],
  "medium-blue": ["blue"],
  "sky-blue": ["blue"],
  "powder-blue": ["blue"],
  "icy-blue": ["blue"],
  "dusty-blue": ["blue"],
  "grey-blue": ["blue", "charcoal"],
  "navy": ["navy"],
  "deep-navy": ["navy", "black"],
  "denim": ["blue", "navy"],
  "midnight-blue": ["navy", "indigo"],
  "periwinkle": ["blue", "purple"],

  // Purples
  "lavender": ["purple", "pink"],
  "soft-plum": ["purple"],
  "deep-plum": ["purple"],
  "plum": ["purple"],
  "warm-plum": ["purple"],
  "royal-purple": ["purple"],
  "orchid": ["purple", "pink"],
  "violet": ["violet", "purple", "indigo"],
  "amethyst": ["purple"],
  "aubergine": ["purple"],
  "dusty-purple": ["purple"],
  "mauve": ["purple", "pink"],
  "mauve-pink": ["purple", "pink"],

  // Neutrals
  "ivory": ["white", "cream"],
  "cream": ["cream", "white"],
  "off-white": ["white", "cream"],
  "dove-white": ["white"],
  "bright-white": ["white"],
  "pure-white": ["white"],
  "blush": ["pink", "cream"],
  "dusty-rose": ["pink", "cream"],
  "soft-coral": ["pink", "orange"],
  "sand": ["cream", "brown"],
  "khaki": ["cream", "brown", "green"],

  // Greys / Blacks
  "cool-grey": ["charcoal"],
  "slate-grey": ["charcoal", "navy"],
  "charcoal": ["charcoal", "black"],
  "stone": ["charcoal", "cream"],
  "cool-taupe": ["charcoal", "brown"],
  "warm-taupe": ["brown", "charcoal"],
  "silver": ["charcoal", "white"],
  "black": ["black"],
};

// Given a palette color ID, return matching product color IDs
export const getColorFamilies = (paletteColorId) => {
  return COLOR_FAMILY_MAP[paletteColorId] || [paletteColorId];
};

// Given a full palette, return all matching product color IDs
export const getPaletteProductColors = (palette) => {
  const allColorIds = new Set();
  palette.forEach(color => {
    const families = getColorFamilies(color.id);
    families.forEach(f => allColorIds.add(f));
  });
  return [...allColorIds];
};

import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, Camera, RefreshCw, Sparkles, Save, ShoppingBag, Shield, Info, X } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { analyzeSkinApi } from "@/lib/skinApi";
import { generatePalette, getColorFamilies, getPaletteProductColors } from "../utils/autoColorEngine";
import API from '@/lib/api';

// Color keyword definitions...
const COLOR_KEYWORDS = {
    red: ['red', 'crimson', 'scarlet', 'maroon', 'ruby', 'cherry', 'burgundy', 'wine'],
    orange: ['orange', 'tangerine', 'rust', 'terracotta', 'cinnamon', 'copper'],
    yellow: ['yellow', 'mustard', 'golden', 'saffron', 'amber', 'lemon'],
    green: ['green', 'olive', 'moss', 'forest', 'sage', 'emerald', 'jade', 'mint', 'khaki'],
    teal: ['teal', 'turquoise', 'aqua', 'cyan'],
    blue: ['blue', 'cobalt', 'sapphire', 'sky', 'denim', 'azure', 'royal blue'],
    indigo: ['indigo'],
    purple: ['purple', 'violet', 'plum', 'lavender', 'mauve', 'lilac'],
    pink: ['pink', 'rose', 'blush', 'fuchsia', 'magenta', 'salmon', 'peach'],
    gold: ['gold', 'golden', 'bronze'],
    charcoal: ['charcoal', 'dark grey', 'dark gray', 'graphite', 'slate'],
    cream: ['cream', 'ivory', 'beige', 'off-white', 'offwhite', 'camel', 'tan', 'nude'],
    navy: ['navy', 'midnight'],
    black: ['black', 'onyx', 'ebony', 'jet', 'noir'],
    white: ['white', 'snow', 'pearl', 'chalk'],
    brown: ['brown', 'chocolate', 'coffee', 'espresso', 'mocha', 'caramel', 'cocoa', 'sienna'],
};

// Simplified color groups for "Similar Match" logic
const COLOR_GROUPS = {
    NEUTRALS: ['white', 'cream', 'ivory', 'beige', 'off-white', 'offwhite', 'sand', 'silver', 'grey', 'charcoal', 'black', 'nude', 'tan', 'camel'],
    WARMS: ['red', 'crimson', 'scarlet', 'maroon', 'ruby', 'cherry', 'burgundy', 'wine', 'orange', 'tangerine', 'rust', 'terracotta', 'cinnamon', 'copper', 'yellow', 'mustard', 'golden', 'saffron', 'amber', 'lemon', 'gold', 'bronze', 'pink', 'rose', 'blush', 'fuchsia', 'magenta', 'salmon', 'peach', 'brown', 'chocolate', 'coffee', 'espresso', 'mocha', 'caramel', 'cocoa', 'sienna'],
    COOLS: ['blue', 'cobalt', 'sapphire', 'sky', 'denim', 'azure', 'royal blue', 'teal', 'turquoise', 'aqua', 'cyan', 'green', 'olive', 'moss', 'forest', 'sage', 'emerald', 'jade', 'mint', 'khaki', 'indigo', 'purple', 'violet', 'plum', 'lavender', 'mauve', 'lilac', 'navy', 'midnight']
};

// Find which group a set of product colors belongs to
const getColorGroup = (colors) => {
    if (!colors || colors.length === 0) return null;
    for (const [groupName, groupColors] of Object.entries(COLOR_GROUPS)) {
        if (colors.some(c => groupColors.includes(c))) return groupName;
    }
    return null;
};

// Detect product color from its database 'colors' field AND its name
const detectProductColors = (product) => {
    const matchedColors = new Set();
    const name = (product.name || '').toLowerCase();
    const dbColors = Array.isArray(product.colors) ? product.colors : [];

    // 1. Check colors array from DB (highest priority)
    dbColors.forEach(color => {
        const cleanColor = color.toLowerCase().trim();
        for (const [colorId, keywords] of Object.entries(COLOR_KEYWORDS)) {
            if (colorId === cleanColor || keywords.includes(cleanColor)) {
                matchedColors.add(colorId);
            }
        }
    });

    // 2. Fallback: Search in name using keywords
    for (const [colorId, keywords] of Object.entries(COLOR_KEYWORDS)) {
        if (keywords.some(kw => {
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            return regex.test(name);
        })) {
            matchedColors.add(colorId);
        }
    }

    return Array.from(matchedColors);
};

export default function StyleScanPage() {
    const [selectedGender, setSelectedGender] = useState('men');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [hasConsented, setHasConsented] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(null);
    const [dbProducts, setDbProducts] = useState([]);
    const [isFetchingPaletteFull, setIsFetchingPaletteFull] = useState(false);
    const [paletteFullProducts, setPaletteFullProducts] = useState([]);
    const [isPaletteExactMatch, setIsPaletteExactMatch] = useState(true);
    const [isPaletteSimilarMatch, setIsPaletteSimilarMatch] = useState(false);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const { addSavedStyle, user } = useStore();
    const navigate = useNavigate();

    // Fetch products from database on mount
    useEffect(() => {
        const fetchProducts = async (isRetry = false) => {
            try {
                // Fetch slim version (no images) to avoid proxy timeouts with base64 data
                const url = isRetry ? 'http://localhost:5001/api/products?slim=true' : '/products?slim=true';
                const { data } = await API.get(url);

                // Enrich each product with detected colors
                const enriched = data.map(p => ({
                    ...p,
                    id: p._id,
                    detectedColors: detectProductColors(p),
                }));
                setDbProducts(enriched);
            } catch (err) {
                console.error('Failed to fetch products:', err);
                if (!isRetry) {
                    console.log('Retrying with direct backend URL...');
                    fetchProducts(true);
                }
            }
        };
        fetchProducts();
    }, []);

    const startCamera = async () => {
        if (!user) {
            toast.error("Please log in to use Style Scan");
            navigate('/register');
            return;
        }

        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera. Please allow permissions.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        setIsCameraOpen(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                setImageFile(file);
                setUploadedImage(URL.createObjectURL(blob));
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const handleProtectedAction = (action) => {
        if (!user) {
            toast.error("Please log in to use Style Scan");
            navigate('/register');
            return;
        }
        action();
    };

    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        setImageFile(file); // ✅ THIS IS STEP 3 (REAL FILE)

        const reader = new FileReader();
        reader.onload = (event) => {
            setUploadedImage(event.target?.result); // preview only
            setAnalysisResult(null);
        };
        reader.readAsDataURL(file);
    }, []);


    const handleDrop = useCallback((e) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please log in to use Style Scan");
            navigate('/register');
            return;
        }

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setImageFile(file); // ✅ REAL FILE

            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result);
                setAnalysisResult(null);
            };
            reader.readAsDataURL(file);
        }
    }, []);


    const handleAnalyze = async () => {
        if (!imageFile || !hasConsented) return;

        setIsAnalyzing(true);

        try {
            const data = await analyzeSkinApi(imageFile);

            const skinTone = data.skinTone || "Medium";
            const undertone = data.undertone || "warm";

            // 1. Generate palette
            const palette = generatePalette(skinTone, undertone);
            const matchingProductColors = getPaletteProductColors(palette);

            // 2. Filter DB products (slim versions) that match the colors AND gender
            const matchedSlim = dbProducts.filter(p =>
                p.category === selectedGender &&
                p.detectedColors && p.detectedColors.some(c => matchingProductColors.includes(c))
            );

            // 3. Select which products to show (priority to matches, fallback to all in category)
            const subsetToFetch = matchedSlim.length > 0
                ? matchedSlim.slice(0, 8)
                : dbProducts.filter(p => p.category === selectedGender).slice(0, 8);

            // 4. Fetch FULL product data (including images) for the selected subset
            const fullRecommendations = await Promise.all(
                subsetToFetch.map(async (p) => {
                    try {
                        const { data } = await API.get(`/products/${p.id || p._id}`);
                        return { ...data, id: data._id };
                    } catch (e) {
                        return p; // fallback to slim if full fetch fails
                    }
                })
            );

            setAnalysisResult({
                skinTone,
                undertone,
                colorPalette: palette,
                recommendations: fullRecommendations,
            });
            toast.success("Analysis complete!");
        } catch (error) {
            const errType = error?.response?.data?.errorType;

            if (errType === "NO_FACE") {
                toast.error("No face detected. Please upload a clear face photo.");
            } else if (errType === "FULL_BODY") {
                toast.error("Please upload only a face photo (no full body).");
            } else if (errType === "INVALID_IMAGE") {
                toast.error("Invalid image file.");
            } else {
                toast.error("Skin analysis failed. Try another image.");
            }

            console.error("Skin scan error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleSaveStyle = () => {
        if (!analysisResult) return;

        const newStyle = {
            id: Date.now().toString(),
            name: `My Style ${new Date().toLocaleDateString()}`,
            createdAt: new Date(),
            skinTone: analysisResult.skinTone,
            undertone: analysisResult.undertone,
            colorPalette: analysisResult.colorPalette,
            recommendedProducts: analysisResult.recommendations,
        };

        addSavedStyle(newStyle);
        toast.success('Style saved to your profile!');
    };

    const handleColorClick = async (color) => {
        if (selectedColor?.id === color.id) {
            setSelectedColor(null);
            setPaletteFullProducts([]);
            setIsPaletteSimilarMatch(false);
            return;
        }

        setSelectedColor(color);
        setIsFetchingPaletteFull(true);

        const families = getColorFamilies(color.id);
        const matchedSlim = dbProducts.filter(p =>
            p.category === selectedGender &&
            p.detectedColors && p.detectedColors.some(c => families.includes(c))
        );

        const hasExact = matchedSlim.length > 0;
        setIsPaletteExactMatch(hasExact);

        let subsetToFetch = [];
        let isSimilar = false;

        if (hasExact) {
            subsetToFetch = matchedSlim.slice(0, 8);
        } else {
            // Find similar group products
            const currentGroup = getColorGroup(families);
            const similarSlim = dbProducts.filter(p => {
                const productGroup = getColorGroup(p.detectedColors);
                return p.category === selectedGender && productGroup === currentGroup && currentGroup !== null;
            });

            if (similarSlim.length > 0) {
                subsetToFetch = similarSlim.slice(0, 8);
                isSimilar = true;
            } else {
                // Total fallback in category
                subsetToFetch = dbProducts.filter(p => p.category === selectedGender).slice(0, 8);
            }
        }

        setIsPaletteSimilarMatch(isSimilar);

        try {
            const fullResults = await Promise.all(
                subsetToFetch.map(async (p) => {
                    const { data } = await API.get(`/products/${p.id || p._id}`);
                    return { ...data, id: data._id };
                })
            );
            setPaletteFullProducts(fullResults);
        } catch (e) {
            console.error("Failed to fetch full products for palette selection", e);
            setPaletteFullProducts(subsetToFetch); // fallback to slim
        } finally {
            setIsFetchingPaletteFull(false);
        }
    };

    const handleRetake = () => {
        setUploadedImage(null);
        setAnalysisResult(null);
        setHasConsented(false);
        setSelectedColor(null);
        setImageFile(null);
        setPaletteFullProducts([]);
        setIsPaletteSimilarMatch(false);
    };

    return (
        <div className="min-h-screen overflow-y-auto">
            <Header />

            <main className="pt-24 pb-20">
                <div className="container max-w-4xl">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <span className="text-small text-accent mb-4 block">AI-Powered</span>
                        <h1 className="text-section mb-4">Style Scan</h1>
                        <p className="text-body max-w-xl mx-auto">
                            Upload a photo of yourself and let our AI analyze your skin tone,
                            undertone, and recommend colors that complement your unique features.
                        </p>
                    </div>

                    {!analysisResult ? (
                        <>
                            {/* Gender Selection */}
                            <div className="flex justify-center mb-8">
                                <div className="bg-secondary/50 p-1.5 rounded-full flex gap-1.5 shadow-inner">
                                    {['men', 'women'].map((gender) => (
                                        <button
                                            key={gender}
                                            onClick={() => setSelectedGender(gender)}
                                            className={cn(
                                                "px-10 py-3 rounded-full text-sm font-semibold transition-all duration-300 capitalize flex items-center gap-2",
                                                selectedGender === gender
                                                    ? "bg-background shadow-md text-foreground scale-[1.02]"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                            )}
                                        >
                                            <span className={cn(
                                                "h-2 w-2 rounded-full",
                                                selectedGender === gender ? "bg-accent" : "bg-transparent"
                                            )} />
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className={cn(
                                    'relative rounded-2xl border-2 border-dashed transition-all duration-300 mb-8',
                                    uploadedImage
                                        ? 'border-accent bg-accent/5'
                                        : 'border-border hover:border-accent/50 hover:bg-secondary/50'
                                )}
                            >
                                {uploadedImage ? (
                                    <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                                        <div className="w-48 h-48 rounded-xl overflow-hidden bg-secondary shrink-0">
                                            <img
                                                src={uploadedImage}
                                                alt="Uploaded preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="font-display text-xl mb-2">Photo Ready</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Your photo has been uploaded successfully. Review the privacy notice
                                                and click "Analyze My Style" to begin.
                                            </p>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    Change Photo
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        handleRetake();
                                                        setTimeout(() => startCamera(), 100);
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <Camera className="h-4 w-4" />
                                                    Retake Selfie
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : isCameraOpen ? (
                                    <div className="relative rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center min-h-[400px]">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover absolute inset-0 transform scale-x-[-1]"
                                        />
                                        <canvas ref={canvasRef} className="hidden" />

                                        <div className="absolute bottom-6 flex gap-4 z-10">
                                            <Button
                                                onClick={captureImage}
                                                className="rounded-full h-14 w-14 bg-white hover:bg-white/90 p-0 border-4 border-accent flex items-center justify-center shadow-lg"
                                            >
                                                <div className="h-10 w-10 rounded-full bg-accent" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-full h-10 w-10 absolute -right-16 top-2"
                                                onClick={stopCamera}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 md:p-20 text-center">
                                        <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                                            <Upload className="h-8 w-8 text-accent" />
                                        </div>
                                        <h3 className="font-display text-xl mb-2">Upload Your Photo</h3>
                                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                            Drag and drop an image here, or click to select from your device
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                            <Button
                                                onClick={() => handleProtectedAction(() => fileInputRef.current?.click())}
                                                className="btn-primary gap-2"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Choose File
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => handleProtectedAction(startCamera)}
                                            >
                                                <Camera className="h-4 w-4" />
                                                Use Camera
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* Privacy Consent */}
                            {uploadedImage && (
                                <div className="rounded-xl bg-secondary/50 p-6 mb-8">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                            <Shield className="h-5 w-5 text-accent" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-display text-lg mb-2">Privacy Notice</h4>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Your photo will be processed securely using our AI technology.
                                                We do not store your images on our servers after analysis.
                                                Your data is encrypted and never shared with third parties.
                                            </p>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={hasConsented}
                                                    onChange={(e) => setHasConsented(e.target.checked)}
                                                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                                                />
                                                <span className="text-sm">
                                                    I understand and agree to the privacy terms
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Analyze Button */}
                            {uploadedImage && (
                                <div className="text-center">
                                    <Button
                                        size="lg"
                                        className="btn-gold gap-2"
                                        onClick={handleAnalyze}
                                        disabled={!hasConsented || isAnalyzing}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <RefreshCw className="h-5 w-5 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-5 w-5" />
                                                Analyze My Style
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* Analysis Results */
                        <div className="space-y-12">
                            {/* Results Summary */}
                            <div className="card-elevated p-8 md:p-10">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-secondary shrink-0 mx-auto md:mx-0">
                                        <img
                                            src={uploadedImage}
                                            alt="Your photo"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <span className="text-small text-accent mb-2 block">Your Analysis</span>
                                        <h2 className="text-section mb-4">Style Profile</h2>

                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <p className="text-small mb-1">Skin Tone</p>
                                                <p className="font-display text-lg">{analysisResult.skinTone}</p>
                                            </div>
                                            <div>
                                                <p className="text-small mb-1">Undertone</p>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="inline-block h-4 w-4 rounded-full border border-border"
                                                        style={{
                                                            backgroundColor:
                                                                analysisResult.undertone?.toLowerCase() === 'warm' ? '#DAA520'
                                                                    : analysisResult.undertone?.toLowerCase() === 'cool' ? '#4682B4'
                                                                        : '#9E9E9E'
                                                        }}
                                                    />
                                                    <p className="font-display text-lg capitalize">{analysisResult.undertone}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <Button onClick={handleSaveStyle} className="gap-2">
                                                <Save className="h-4 w-4" />
                                                Save Style
                                            </Button>
                                            <Button variant="outline" onClick={handleRetake} className="gap-2">
                                                <RefreshCw className="h-4 w-4" />
                                                Retake Scan
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Color Palette */}
                            <div>
                                <div className="text-center mb-8">
                                    <span className="text-small text-accent mb-2 block">Your Perfect Colors</span>
                                    <h3 className="text-section">Recommended Palette</h3>
                                </div>

                                <div className="flex overflow-x-auto pt-4 pb-12 gap-6 justify-start md:justify-center px-8 scrollbar-hide">
                                    {analysisResult.colorPalette.map((color, index) => (
                                        <div
                                            key={index}
                                            className="text-center shrink-0 cursor-pointer group"
                                            onClick={() => handleColorClick(color)}
                                        >
                                            <div
                                                className={cn(
                                                    'h-20 w-20 rounded-full shadow-card mb-2 transition-all duration-200',
                                                    'hover:scale-110 hover:shadow-lg',
                                                    selectedColor?.id === color.id
                                                        ? 'ring-4 ring-accent ring-offset-2 ring-offset-background scale-110'
                                                        : 'border-4 border-background'
                                                )}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className={cn(
                                                'text-xs uppercase tracking-wide transition-colors',
                                                selectedColor?.id === color.id
                                                    ? 'text-accent font-semibold'
                                                    : 'text-muted-foreground group-hover:text-foreground'
                                            )}>
                                                {color.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {selectedColor && (
                                    <div className="text-center mt-2 mb-4">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">
                                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedColor.hex }} />
                                            Showing products in {selectedColor.name}
                                            <button
                                                onClick={() => setSelectedColor(null)}
                                                className="ml-1 hover:text-foreground transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    </div>
                                )}

                            </div>

                            {/* Recommended Products */}
                            <div>
                                <div className="flex items-end justify-between mb-8">
                                    <div>
                                        <span className="text-small text-accent mb-2 block">Curated For You</span>
                                        <h3 className="text-section">Recommended Products</h3>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="hidden md:flex items-center gap-2 text-sm font-medium underline-gold border-none hover:bg-transparent"
                                        onClick={() => {
                                            const colorParams = analysisResult.colorPalette.map(c => c.id).join(',');
                                            navigate(`/collections?category=${selectedGender}&colors=${colorParams}`);
                                        }}
                                    >
                                        <ShoppingBag className="h-4 w-4" />
                                        View Full {selectedGender.charAt(0).toUpperCase() + selectedGender.slice(1)} Collection
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                    {(() => {
                                        if (isFetchingPaletteFull) {
                                            return Array(4).fill(0).map((_, i) => (
                                                <div key={i} className="animate-pulse bg-secondary aspect-[3/4] rounded-xl" />
                                            ));
                                        }

                                        let filteredProducts;
                                        if (selectedColor) {
                                            filteredProducts = paletteFullProducts;
                                        } else {
                                            filteredProducts = analysisResult.recommendations;
                                        }

                                        return filteredProducts.length > 0 ? (
                                            <>
                                                {selectedColor && !isPaletteExactMatch && (
                                                    <p className="col-span-full text-sm text-muted-foreground mb-2">
                                                        {isPaletteSimilarMatch
                                                            ? `No exact ${selectedColor.name} found. Showing similar color suggestions:`
                                                            : `No products matching ${selectedColor.name} found. Here are other items you might like:`
                                                        }
                                                    </p>
                                                )}
                                                {filteredProducts.map((product) => (
                                                    <ProductCard key={product.id || product._id} product={product} />
                                                ))}
                                            </>
                                        ) : (
                                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                                <p className="mb-2">No products matching <strong>{selectedColor?.name}</strong> found in store.</p>
                                                <button
                                                    onClick={() => setSelectedColor(null)}
                                                    className="text-accent underline text-sm"
                                                >
                                                    Show all recommendations
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

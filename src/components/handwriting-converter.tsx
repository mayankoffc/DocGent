"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, RefreshCw, Wand2 } from "lucide-react";
import jsPDF from "jspdf";
import { getUserPageDimensions, formatBytes } from "@/lib/pdf-optimizer";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { PaperSheet } from "./paper-sheet";

// ============================================================================
// SEEDED RANDOM GENERATOR
// ============================================================================
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// ============================================================================
// CHARACTER STYLE INTERFACE
// ============================================================================
interface CharStyle {
  rotation: number;
  yOffset: number;
  scale: number;
  skew: number;
  opacity: number;
  marginRight: number;
  strokeWidth: number;
  fontFamily: string;
}

// ============================================================================
// FONT SELECTION BASED ON CHARACTER TYPE
// ============================================================================
const HANDWRITING_FONTS = [
  'Cedarville Cursive',
  'Caveat',
  'Shadows Into Light',
  'Patrick Hand',
];

function getFontForType(char: string, random: () => number, fontStyle: string): string {
  if (fontStyle === 'mixed') {
    // Mix fonts for natural look
    if (char.match(/[A-Z]/)) {
      return HANDWRITING_FONTS[Math.floor(random() * 3)];
    } else if (char.match(/[a-z]/)) {
      return HANDWRITING_FONTS[Math.floor(random() * 4)];
    }
    return HANDWRITING_FONTS[0];
  } else {
    // Use single selected font
    return fontStyle;
  }
}

// ============================================================================
// GENERATE CHARACTER STYLE
// ============================================================================
function generateCharStyle(
  char: string,
  index: number,
  seed: number,
  thickness: number,
  fontStyle: string
): CharStyle {
  const random = seededRandom(seed + index);
  
  const isSpace = char === ' ' || char === '\n';
  
  return {
    rotation: isSpace ? 0 : (random() - 0.5) * 4,
    yOffset: isSpace ? 0 : (random() - 0.5) * 3,
    scale: isSpace ? 1 : 0.95 + random() * 0.1,
    skew: isSpace ? 0 : (random() - 0.5) * 2,
    opacity: isSpace ? 1 : 0.85 + random() * 0.15,
    marginRight: isSpace ? 0 : -0.5 + random() * 1,
    strokeWidth: thickness,
    fontFamily: getFontForType(char, random, fontStyle),
  };
}

// ============================================================================
// HANDWRITTEN CHARACTER COMPONENT
// ============================================================================
interface HandwrittenCharProps {
  char: string;
  style: CharStyle;
  delay: number;
}

function HandwrittenChar({ char, style, delay }: HandwrittenCharProps) {
  if (char === '\n') {
    return <br />;
  }
  
  if (char === ' ') {
    return <span style={{ display: 'inline-block', width: '0.3em' }}> </span>;
  }
  
  return (
    <span
      className="ballpoint-ink inline-block"
      style={{
        fontFamily: `'${style.fontFamily}', cursive`,
        ['--target-rot' as string]: `${style.rotation}deg`,
        ['--target-y' as string]: `${style.yOffset}px`,
        ['--target-scale' as string]: style.scale,
        ['--target-opacity' as string]: style.opacity,
        transform: `translateY(${style.yOffset}px) scale(${style.scale}) rotate(${style.rotation}deg) skewX(${style.skew}deg)`,
        opacity: style.opacity,
        marginRight: `${style.marginRight}px`,
        fontWeight: style.strokeWidth > 0.6 ? 'bold' : 'normal',
        animation: `writeIn 0.3s ease-out ${delay}s both`,
      }}
    >
      {char}
    </span>
  );
}

// ============================================================================
// HANDWRITTEN LINE SVG (for underlines, strikethroughs)
// ============================================================================
interface HandwrittenLineSVGProps {
  width: number;
  isStrike?: boolean;
  seed: number;
}

function HandwrittenLineSVG({ width, isStrike = false, seed }: HandwrittenLineSVGProps) {
  const random = seededRandom(seed);
  const points: string[] = [];
  const step = 5;
  
  for (let x = 0; x <= width; x += step) {
    const y = isStrike ? 10 : 18;
    const wobble = (random() - 0.5) * 2;
    points.push(`${x},${y + wobble}`);
  }
  
  return (
    <svg
      width={width}
      height="20"
      style={{ position: 'absolute', left: 0, top: 0 }}
      className="pointer-events-none"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#0a2472"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

// ============================================================================
// MATHEMATICAL COMPONENTS
// ============================================================================
interface HandwrittenFractionProps {
  numerator: string;
  denominator: string;
  seed: number;
  thickness: number;
  fontStyle: string;
}

function HandwrittenFraction({ numerator, denominator, seed, thickness, fontStyle }: HandwrittenFractionProps) {
  const random = seededRandom(seed);
  const lineWidth = Math.max(numerator.length, denominator.length) * 12;
  
  return (
    <span className="inline-flex flex-col items-center mx-1 relative" style={{ verticalAlign: 'middle' }}>
      <span className="text-sm">
        {numerator.split('').map((char, i) => (
          <HandwrittenChar
            key={i}
            char={char}
            style={generateCharStyle(char, i, seed, thickness, fontStyle)}
            delay={0}
          />
        ))}
      </span>
      <HandwrittenLineSVG width={lineWidth} seed={seed + 1000} />
      <span className="text-sm">
        {denominator.split('').map((char, i) => (
          <HandwrittenChar
            key={i}
            char={char}
            style={generateCharStyle(char, i, seed + 500, thickness, fontStyle)}
            delay={0}
          />
        ))}
      </span>
    </span>
  );
}

interface HandwrittenSqrtProps {
  content: string;
  seed: number;
  thickness: number;
  fontStyle: string;
}

function HandwrittenSqrt({ content, seed, thickness, fontStyle }: HandwrittenSqrtProps) {
  return (
    <span className="inline-flex items-center mx-1 relative">
      <svg width="20" height="30" viewBox="0 0 20 30" style={{ marginRight: 2 }}>
        <path
          d="M 2 20 L 8 28 L 10 18 L 10 5"
          fill="none"
          stroke="#0a2472"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="border-t-2 border-[#0a2472] px-1">
        {content.split('').map((char, i) => (
          <HandwrittenChar
            key={i}
            char={char}
            style={generateCharStyle(char, i, seed, thickness, fontStyle)}
            delay={0}
          />
        ))}
      </span>
    </span>
  );
}

interface HandwrittenStrikeProps {
  content: string;
  seed: number;
  thickness: number;
  fontStyle: string;
}

function HandwrittenStrike({ content, seed, thickness, fontStyle }: HandwrittenStrikeProps) {
  const contentWidth = content.length * 10;
  
  return (
    <span className="inline-block relative mx-1">
      <span>
        {content.split('').map((char, i) => (
          <HandwrittenChar
            key={i}
            char={char}
            style={generateCharStyle(char, i, seed, thickness, fontStyle)}
            delay={0}
          />
        ))}
      </span>
      <HandwrittenLineSVG width={contentWidth} isStrike={true} seed={seed + 2000} />
    </span>
  );
}

// ============================================================================
// PENCIL DRAWING COMPONENTS
// ============================================================================
interface WobbleLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  seed: number;
}

function WobbleLine({ x1, y1, x2, y2, seed }: WobbleLineProps) {
  const random = seededRandom(seed);
  const points: string[] = [];
  const steps = 20;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t + (random() - 0.5) * 2;
    const y = y1 + (y2 - y1) * t + (random() - 0.5) * 2;
    points.push(`${x},${y}`);
  }
  
  return (
    <polyline
      points={points.join(' ')}
      fill="none"
      stroke="#666"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="graphite-pencil"
    />
  );
}

interface PencilTextProps {
  text: string;
  x: number;
  y: number;
}

function PencilText({ text, x, y }: PencilTextProps) {
  return (
    <text
      x={x}
      y={y}
      fontFamily="'Caveat', cursive"
      fontSize="14"
      fill="#666"
      className="graphite-pencil"
    >
      {text}
    </text>
  );
}

interface PencilArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  seed: number;
}

function PencilArrow({ x1, y1, x2, y2, seed }: PencilArrowProps) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLength = 8;
  const arrowAngle = Math.PI / 6;
  
  const arrow1X = x2 - arrowLength * Math.cos(angle - arrowAngle);
  const arrow1Y = y2 - arrowLength * Math.sin(angle - arrowAngle);
  const arrow2X = x2 - arrowLength * Math.cos(angle + arrowAngle);
  const arrow2Y = y2 - arrowLength * Math.sin(angle + arrowAngle);
  
  return (
    <g>
      <WobbleLine x1={x1} y1={y1} x2={x2} y2={y2} seed={seed} />
      <WobbleLine x1={x2} y1={y2} x2={arrow1X} y2={arrow1Y} seed={seed + 1} />
      <WobbleLine x1={x2} y1={y2} x2={arrow2X} y2={arrow2Y} seed={seed + 2} />
    </g>
  );
}

interface HandwrittenDiagramProps {
  seed: number;
}

function HandwrittenDiagram({ seed }: HandwrittenDiagramProps) {
  return (
    <div className="my-4 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
      <svg width="100%" height="150" viewBox="0 0 300 150">
        <defs>
          <filter id="pencil-texture">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
          </filter>
        </defs>
        
        {/* Example diagram: simple flow */}
        <WobbleLine x1={50} y1={50} x2={120} y2={50} seed={seed} />
        <circle cx={50} cy={50} r={15} fill="none" stroke="#666" strokeWidth="1.5" className="graphite-pencil" />
        <PencilText text="Start" x={38} y={55} />
        
        <PencilArrow x1={120} y1={50} x2={180} y2={50} seed={seed + 10} />
        
        <rect x={165} y={30} width={50} height={40} fill="none" stroke="#666" strokeWidth="1.5" className="graphite-pencil" />
        <PencilText text="Process" x={173} y={55} />
        
        <PencilArrow x1={215} y1={50} x2={250} y2={50} seed={seed + 20} />
        
        <circle cx={265} cy={50} r={15} fill="none" stroke="#666" strokeWidth="1.5" className="graphite-pencil" />
        <PencilText text="End" x={253} y={55} />
      </svg>
    </div>
  );
}

// ============================================================================
// LINE PARSER FOR SPECIAL SYNTAX
// ============================================================================
interface HandwrittenLineParserProps {
  text: string;
  seed: number;
  thickness: number;
  fontStyle: string;
}

function HandwrittenLineParser({ text, seed, thickness, fontStyle }: HandwrittenLineParserProps) {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let charIndex = 0;
  
  // Parse FRAC[num|den]
  const fracRegex = /FRAC\[([^\|]+)\|([^\]]+)\]/g;
  // Parse SQRT[content]
  const sqrtRegex = /SQRT\[([^\]]+)\]/g;
  // Parse STRIKE[content]
  const strikeRegex = /STRIKE\[([^\]]+)\]/g;
  // Parse DIAGRAM[]
  const diagramRegex = /DIAGRAM\[\]/g;
  
  // Combine all patterns
  const combinedRegex = /FRAC\[([^\|]+)\|([^\]]+)\]|SQRT\[([^\]]+)\]|STRIKE\[([^\]]+)\]|DIAGRAM\[\]/g;
  
  let match;
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      const beforeText = text.slice(currentIndex, match.index);
      beforeText.split('').forEach((char) => {
        parts.push(
          <HandwrittenChar
            key={charIndex}
            char={char}
            style={generateCharStyle(char, charIndex, seed, thickness, fontStyle)}
            delay={charIndex * 0.01}
          />
        );
        charIndex++;
      });
    }
    
    // Add special component
    if (match[0].startsWith('FRAC')) {
      parts.push(
        <HandwrittenFraction
          key={charIndex}
          numerator={match[1]}
          denominator={match[2]}
          seed={seed + charIndex}
          thickness={thickness}
          fontStyle={fontStyle}
        />
      );
    } else if (match[0].startsWith('SQRT')) {
      parts.push(
        <HandwrittenSqrt
          key={charIndex}
          content={match[3]}
          seed={seed + charIndex}
          thickness={thickness}
          fontStyle={fontStyle}
        />
      );
    } else if (match[0].startsWith('STRIKE')) {
      parts.push(
        <HandwrittenStrike
          key={charIndex}
          content={match[4]}
          seed={seed + charIndex}
          thickness={thickness}
          fontStyle={fontStyle}
        />
      );
    } else if (match[0].startsWith('DIAGRAM')) {
      parts.push(
        <HandwrittenDiagram key={charIndex} seed={seed + charIndex} />
      );
    }
    
    charIndex += 10;
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    remainingText.split('').forEach((char) => {
      parts.push(
        <HandwrittenChar
          key={charIndex}
          char={char}
          style={generateCharStyle(char, charIndex, seed, thickness, fontStyle)}
          delay={charIndex * 0.01}
        />
      );
      charIndex++;
    });
  }
  
  return <>{parts}</>;
}

// ============================================================================
// FORM SCHEMA
// ============================================================================
const fontStyleEnum = z.enum(['mixed', 'Cedarville Cursive', 'Caveat', 'Shadows Into Light', 'Patrick Hand']);

const formSchema = z.object({
  fontStyle: fontStyleEnum.default('mixed'),
});

type FormSchemaType = z.infer<typeof formSchema>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function HandwritingConverter() {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState('');
  const [randomSeed, setRandomSeed] = useState(Date.now());
  const [inkThickness, setInkThickness] = useState([0.5]);
  const [isScannerMode, setIsScannerMode] = useState(false);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fontStyle: 'mixed',
    },
  });

  const fontStyle = form.watch('fontStyle');
  
  const handleRegenerate = () => {
    setRandomSeed(Date.now());
    toast({ title: 'Regenerated', description: 'New handwriting variation applied.' });
  };

  const handleDownloadPDF = (cleanMode: boolean) => {
    if (!sourceText) {
      toast({ variant: 'destructive', title: 'Nothing to Download', description: 'Please enter some text first.' });
      return;
    }

    // Get user's page settings
    const userPageDimensions = getUserPageDimensions();
    const defaultOrientation = localStorage.getItem('defaultOrientation') || 'portrait';
    const pageSize = localStorage.getItem('defaultPageSize') || 'A4';
    
    const pdf = new jsPDF({
      orientation: defaultOrientation === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: pageSize.toLowerCase(),
    });

    const htmlContent = generateHtmlForPdf(sourceText, fontStyle, randomSeed, inkThickness[0], cleanMode);

    pdf.html(htmlContent, {
      callback: function (doc) {
        const pdfBlob = doc.output('blob');
        const sizeMB = pdfBlob.size / (1024 * 1024);
        const maxSizeMB = parseInt(localStorage.getItem('maxDownloadSize') || '10');
        
        doc.save(`handwritten-note-${cleanMode ? 'clean' : 'scanned'}.pdf`);
        
        if (sizeMB > maxSizeMB) {
          toast({
            title: 'Warning',
            description: `PDF size (${formatBytes(pdfBlob.size)}) exceeds limit (${maxSizeMB}MB)`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Download Started',
            description: `Note downloaded (${formatBytes(pdfBlob.size)})`
          });
        }
      },
      x: 0,
      y: 0,
      width: defaultOrientation === 'landscape' ? 297 : 210,
      windowWidth: 794,
    });
  };

  const renderedText = useMemo(() => {
    if (!sourceText) return null;
    
    return sourceText.split('\n').map((line, lineIndex) => (
      <div key={lineIndex} className="mb-2" style={{ lineHeight: '32px' }}>
        <HandwrittenLineParser
          text={line}
          seed={randomSeed + lineIndex * 1000}
          thickness={inkThickness[0]}
          fontStyle={fontStyle}
        />
      </div>
    ));
  }, [sourceText, randomSeed, inkThickness, fontStyle]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Handwriting Converter</CardTitle>
          <CardDescription>
            Transform your text into realistic handwriting with natural variations, mathematical expressions, and diagrams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: Input & Controls */}
            <div className="space-y-6">
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fontStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4" /> Handwriting Style
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mixed">Mixed (Natural)</SelectItem>
                            <SelectItem value="Cedarville Cursive">Cedarville Cursive</SelectItem>
                            <SelectItem value="Caveat">Caveat</SelectItem>
                            <SelectItem value="Shadows Into Light">Shadows Into Light</SelectItem>
                            <SelectItem value="Patrick Hand">Patrick Hand</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Ink Thickness: {inkThickness[0].toFixed(2)}</Label>
                    <Slider
                      value={inkThickness}
                      onValueChange={setInkThickness}
                      min={0.3}
                      max={1.0}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="scanner-mode">Scanner Mode</Label>
                    <Switch
                      id="scanner-mode"
                      checked={isScannerMode}
                      onCheckedChange={setIsScannerMode}
                    />
                  </div>

                  <FormItem>
                    <FormLabel>Your Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your text here... Try: FRAC[1|2] or SQRT[x+1] or STRIKE[mistake] or DIAGRAM[]"
                        className="h-64 font-mono text-sm"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-2">
                      Special syntax: FRAC[num|den], SQRT[expr], STRIKE[text], DIAGRAM[]
                    </p>
                  </FormItem>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={!sourceText}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleDownloadPDF(true)}
                      disabled={!sourceText}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Clean PDF
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDownloadPDF(false)}
                      disabled={!sourceText}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Scanned PDF
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Right Panel: Live Preview */}
            <div className="space-y-4">
              <Label>Live Preview</Label>
              <div className="w-full aspect-[8.5/11] rounded-lg shadow-lg overflow-auto">
                <PaperSheet isScannerMode={isScannerMode}>
                  <div className="text-lg" style={{ color: '#0a2472' }}>
                    {renderedText || (
                      <p className="text-gray-400 text-center mt-8">
                        Your handwritten text will appear here...
                      </p>
                    )}
                  </div>
                </PaperSheet>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PDF GENERATION HELPER
// ============================================================================
function generateHtmlForPdf(
  text: string,
  fontStyle: string,
  seed: number,
  thickness: number,
  cleanMode: boolean
): string {
  const fontsToLoad = fontStyle === 'mixed'
    ? HANDWRITING_FONTS
    : [fontStyle];

  const fontImports = fontsToLoad
    .map(font => font.replace(/ /g, '+'))
    .join('&family=');

  // Generate styled content
  const lines = text.split('\n');
  const styledLines = lines.map((line, lineIndex) => {
    let html = '';
    let charIndex = 0;
    
    // Simple rendering for PDF (no complex parsing in PDF)
    for (const char of line) {
      if (char === ' ') {
        html += '<span style="display:inline-block;width:0.3em;"> </span>';
      } else {
        const style = generateCharStyle(char, charIndex, seed + lineIndex * 1000, thickness, fontStyle);
        html += `<span style="font-family:'${style.fontFamily}',cursive;transform:translateY(${style.yOffset}px) scale(${style.scale}) rotate(${style.rotation}deg) skewX(${style.skew}deg);opacity:${style.opacity};margin-right:${style.marginRight}px;display:inline-block;font-weight:${style.strokeWidth > 0.6 ? 'bold' : 'normal'};">${char}</span>`;
        charIndex++;
      }
    }
    
    return `<div style="margin-bottom:8px;line-height:32px;">${html}</div>`;
  }).join('');

  const paperBackground = cleanMode
    ? `background: linear-gradient(to bottom, #fff 0%, #fafafa 100%);
       background-image: repeating-linear-gradient(
         transparent 0px,
         transparent 31px,
         #e5e5e5 31px,
         #e5e5e5 32px
       );`
    : `background-color: #f5f5f0;
       filter: contrast(1.1) brightness(0.98);
       background-image: repeating-linear-gradient(
         transparent 0px,
         transparent 31px,
         #e5e5e5 31px,
         #e5e5e5 32px
       );`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=${fontImports}&display=swap');
        body {
          margin: 0;
          padding: 0;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          ${paperBackground}
          color: #0a2472;
          padding: 20mm;
        }
        .content {
          position: relative;
        }
      </style>
    </head>
    <body>
      <div class="content">${styledLines}</div>
    </body>
    </html>
  `;
}

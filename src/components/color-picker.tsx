import Color from 'color';
import { PipetteIcon } from 'lucide-react';
import { Slider } from 'radix-ui';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
type ColorPickerMode = 'hex' | 'rgb' | 'css' | 'hsl';

interface ColorPickerContextValue {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  mode: ColorPickerMode;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  setMode: (mode: ColorPickerMode) => void;
}
const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined
);
export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error('useColorPicker must be used within a ColorPickerProvider');
  }
  return context;
};
export type ColorPickerProps = HTMLAttributes<HTMLDivElement> & {
  value?: Parameters<typeof Color>[0];
  defaultValue?: Parameters<typeof Color>[0];
  onChange?: (value: string) => void;
};
export const ColorPicker = ({
  value,
  defaultValue = '#000000',
  onChange,
  className,
  children,
  ...props
}: ColorPickerProps) => {
  const fallbackColor = useMemo(() => {
    try {
      return Color(defaultValue);
    } catch (error) {
      console.error('Invalid default color provided to ColorPicker:', error);
      return Color('#000000');
    }
  }, [defaultValue]);

  const selectedColor = useMemo(() => {
    try {
      return value ? Color(value) : fallbackColor;
    } catch (error) {
      console.error('Invalid color value provided to ColorPicker:', error);
      return fallbackColor;
    }
  }, [value, fallbackColor]);
  const [hue, setHue] = useState(
    selectedColor.hue() || fallbackColor.hue() || 0
  );
  const [saturation, setSaturation] = useState(
    selectedColor.saturationl() || fallbackColor.saturationl() || 100
  );
  const [lightness, setLightness] = useState(
    selectedColor.lightness() || fallbackColor.lightness() || 50
  );
  const [alpha, setAlpha] = useState(
    (selectedColor.alpha() || fallbackColor.alpha()) * 100 || 100
  );
  const [mode, setMode] = useState<ColorPickerMode>(() => {
    if (!value || typeof value !== 'string') {
      return 'hex';
    }
    if (value.startsWith('rgb')) return 'rgb';
    if (value.startsWith('hsl')) return 'hsl';
    if (value.startsWith('#')) return 'hex';
    return 'css';
  });

  // Update color when controlled value changes
  useEffect(() => {
    if (!value) {
      return;
    }

    try {
      const color = Color(value);
      const [nextHue, nextSaturation, nextLightness] = color
        .hsl()
        .array();

      setHue(nextHue || 0);
      setSaturation(nextSaturation || 0);
      setLightness(nextLightness || 0);
      setAlpha((color.alpha() || 1) * 100);
      if (typeof value === 'string') {
        if (value.startsWith('rgb')) {
          setMode('rgb');
        } else if (value.startsWith('hsl')) {
          setMode('hsl');
        } else if (value.startsWith('#')) {
          setMode('hex');
        } else {
          setMode('css');
        }
      }
    } catch (error) {
      console.error('Failed to parse color value in ColorPicker:', error);
    }
  }, [value]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
      let formatted = color.string();

      switch (mode) {
        case 'hex':
          formatted = alpha === 100 ? color.hex() : color.hexa();
          break;
        case 'rgb':
          formatted = color.rgb().string();
          break;
        case 'hsl':
          formatted = color.hsl().string();
          break;
        case 'css':
        default:
          formatted = color.string();
          break;
      }

      onChange(formatted);
    }
  }, [hue, saturation, lightness, alpha, mode, onChange]);

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        mode,
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
        setMode,
      }}
    >
      <div
        className={cn('flex size-full flex-col gap-4', className)}
        {...props}
      >
        {children}
      </div>
    </ColorPickerContext.Provider>
  );
};
export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;
export const ColorPickerSelection = memo(
  ({ className, ...props }: ColorPickerSelectionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [positionX, setPositionX] = useState(0);
    const [positionY, setPositionY] = useState(0);
    const {
      hue,
      saturation,
      lightness,
      setSaturation,
      setLightness,
    } = useColorPicker();
    const backgroundGradient = useMemo(() => {
      return `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`;
    }, [hue]);
    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        if (!(isDragging && containerRef.current)) {
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width)
        );
        const y = Math.max(
          0,
          Math.min(1, (event.clientY - rect.top) / rect.height)
        );
        setPositionX(x);
        setPositionY(y);
        setSaturation(x * 100);
        setLightness(100 - y * 100);
      },
      [isDragging, setSaturation, setLightness]
    );
    useEffect(() => {
      if (isDragging) {
        return;
      }

      setPositionX(saturation / 100);
      setPositionY(1 - lightness / 100);
    }, [isDragging, saturation, lightness]);
    useEffect(() => {
      const handlePointerUp = () => setIsDragging(false);
      if (isDragging) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
      }
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }, [isDragging, handlePointerMove]);
    return (
      <div
        className={cn('relative size-full cursor-crosshair rounded', className)}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          handlePointerMove(e.nativeEvent);
        }}
        ref={containerRef}
        style={{
          background: backgroundGradient,
        }}
        {...props}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
          style={{
            left: `${positionX * 100}%`,
            top: `${positionY * 100}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    );
  }
);
ColorPickerSelection.displayName = 'ColorPickerSelection';
export type ColorPickerHueProps = ComponentProps<typeof Slider.Root>;
export const ColorPickerHue = ({
  className,
  ...props
}: ColorPickerHueProps) => {
  const { hue, setHue } = useColorPicker();
  return (
    <Slider.Root
      className={cn('relative flex h-4 w-full touch-none', className)}
      max={360}
      onValueChange={([hue]) => setHue(hue)}
      step={1}
      value={[hue]}
      {...props}
    >
      <Slider.Track className="relative my-0.5 h-3 w-full grow rounded-full bg-[linear-gradient(90deg,#FF0000,#FFFF00,#00FF00,#00FFFF,#0000FF,#FF00FF,#FF0000)]">
        <Slider.Range className="absolute h-full" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </Slider.Root>
  );
};
export type ColorPickerAlphaProps = ComponentProps<typeof Slider.Root>;
export const ColorPickerAlpha = ({
  className,
  ...props
}: ColorPickerAlphaProps) => {
  const { alpha, setAlpha } = useColorPicker();
  return (
    <Slider.Root
      className={cn('relative flex h-4 w-full touch-none', className)}
      max={100}
      onValueChange={([alpha]) => setAlpha(alpha)}
      step={1}
      value={[alpha]}
      {...props}
    >
      <Slider.Track
        className="relative my-0.5 h-3 w-full grow rounded-full"
        style={{
          background:
            'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==") left center',
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent to-black/50" />
        <Slider.Range className="absolute h-full rounded-full bg-transparent" />
      </Slider.Track>
      <Slider.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
    </Slider.Root>
  );
};
export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;
export const ColorPickerEyeDropper = ({
  className,
  ...props
}: ColorPickerEyeDropperProps) => {
  const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();
  const handleEyeDropper = async () => {
    try {
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      const [h, s, l] = color.hsl().array();
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setAlpha(100);
    } catch (error) {
      console.error('EyeDropper failed:', error);
    }
  };
  return (
    <Button
      className={cn('shrink-0 text-muted-foreground', className)}
      onClick={handleEyeDropper}
      size="icon"
      variant="outline"
      type="button"
      {...props}
    >
      <PipetteIcon size={16} />
    </Button>
  );
};
export type ColorPickerOutputProps = ComponentProps<typeof SelectTrigger>;
const formats: ColorPickerMode[] = ['hex', 'rgb', 'css', 'hsl'];
export const ColorPickerOutput = ({
  className,
  ...props
}: ColorPickerOutputProps) => {
  const { mode, setMode } = useColorPicker();
  return (
    <Select onValueChange={(value) => setMode(value as ColorPickerMode)} value={mode}>
      <SelectTrigger
        className={cn('h-8 w-20 shrink-0 text-xs', className)}
        {...props}
      >
        <SelectValue placeholder="Mode" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((format) => (
          <SelectItem className="text-xs" key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
type PercentageInputProps = ComponentProps<typeof Input>;
const PercentageInput = ({ className, ...props }: PercentageInputProps) => {
  return (
    <div className="relative">
      <Input
        readOnly
        type="text"
        {...props}
        className={cn(
          'h-8 w-[3.25rem] rounded-l-none bg-secondary px-2 text-xs shadow-none',
          className
        )}
      />
      <span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-xs">
        %
      </span>
    </div>
  );
};
export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>;
export const ColorPickerFormat = ({
  className,
  ...props
}: ColorPickerFormatProps) => {
  const { hue, saturation, lightness, alpha, mode } = useColorPicker();
  const color = Color.hsl(hue, saturation, lightness, alpha / 100);
  if (mode === 'hex') {
    const hex = color.hex();
    return (
      <div
        className={cn(
          '-space-x-px relative flex w-full items-center rounded-md shadow-sm',
          className
        )}
        {...props}
      >
        <Input
          className="h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none"
          readOnly
          type="text"
          value={hex}
        />
        <PercentageInput value={alpha} />
      </div>
    );
  }
  if (mode === 'rgb') {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));
    return (
      <div
        className={cn(
          '-space-x-px flex items-center rounded-md shadow-sm',
          className
        )}
        {...props}
      >
        {rgb.map((value, index) => (
          <Input
            className={cn(
              'h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none',
              index && 'rounded-l-none',
              className
            )}
            key={index}
            readOnly
            type="text"
            value={value}
          />
        ))}
        <PercentageInput value={alpha} />
      </div>
    );
  }
  if (mode === 'css') {
    const rgb = color
      .rgb()
      .array()
      .map((value) => Math.round(value));
    return (
      <div className={cn('w-full rounded-md shadow-sm', className)} {...props}>
        <Input
          className="h-8 w-full bg-secondary px-2 text-xs shadow-none"
          readOnly
          type="text"
          value={`rgba(${rgb.join(', ')}, ${alpha}%)`}
          {...props}
        />
      </div>
    );
  }
  if (mode === 'hsl') {
    const hsl = color
      .hsl()
      .array()
      .map((value) => Math.round(value));
    return (
      <div
        className={cn(
          '-space-x-px flex items-center rounded-md shadow-sm',
          className
        )}
        {...props}
      >
        {hsl.map((value, index) => (
          <Input
            className={cn(
              'h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none',
              index && 'rounded-l-none',
              className
            )}
            key={index}
            readOnly
            type="text"
            value={value}
          />
        ))}
        <PercentageInput value={alpha} />
      </div>
    );
  }
  return null;
};

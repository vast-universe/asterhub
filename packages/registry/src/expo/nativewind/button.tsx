import { Pressable, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-blue-500 active:bg-blue-600",
        secondary: "bg-gray-200 active:bg-gray-300",
        destructive: "bg-red-500 active:bg-red-600",
        outline: "border border-gray-300 bg-transparent",
        ghost: "bg-transparent",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const textVariants = cva("font-medium", {
  variants: {
    variant: {
      default: "text-white",
      secondary: "text-gray-900",
      destructive: "text-white",
      outline: "text-gray-900",
      ghost: "text-gray-900",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  variant,
  size,
  onPress,
  disabled,
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size }),
        disabled && "opacity-50",
        className
      )}
    >
      <Text className={cn(textVariants({ variant, size }))}>{children}</Text>
    </Pressable>
  );
}

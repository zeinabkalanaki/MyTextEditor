import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../../lib/tiptap-utils";
import "@/components/tiptap-ui-primitive/popover/popover.scss";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />;
}

type PopoverContentProps = React.ComponentProps<
  typeof PopoverPrimitive.Content
> & {
  portalContainer?: HTMLElement | null;
};

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  portalContainer,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal container={portalContainer}>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("tiptap-popover", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };

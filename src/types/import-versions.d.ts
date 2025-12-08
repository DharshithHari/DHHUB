// Declarations to map version-appended import specifiers to their base packages
// This helps TypeScript accept imports like "lucide-react@0.487.0" by re-exporting
// from the real package name. Add more mappings here if other packages show up.

type Any = any;

// Helper: default export and named exports forwarded
function _decl(pkg: string, spec: string) {}

declare module "lucide-react@0.487.0" {
  export * from "lucide-react";
  const _default: Any;
  export default _default;
}

declare module "@radix-ui/react-accordion@1.2.3" {
  export * from "@radix-ui/react-accordion";
  const _default: Any;
  export default _default;
}

declare module "@radix-ui/react-alert-dialog@1.1.6" {
  export * from "@radix-ui/react-alert-dialog";
  const _default: Any;
  export default _default;
}

declare module "class-variance-authority@0.7.1" {
  export * from "class-variance-authority";
  const _default: Any;
  export default _default;
}

declare module "@radix-ui/react-aspect-ratio@1.1.2" {
  export * from "@radix-ui/react-aspect-ratio";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-avatar@1.1.3" {
  export * from "@radix-ui/react-avatar";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-slot@1.1.2" {
  export * from "@radix-ui/react-slot";
  const _default: Any; export default _default;
}

declare module "embla-carousel-react@8.6.0" {
  export * from "embla-carousel-react";
  const _default: Any; export default _default;
}

declare module "react-day-picker@8.10.1" {
  export * from "react-day-picker";
  const _default: Any; export default _default;
}

declare module "recharts@2.15.2" {
  export * from "recharts";
  const _default: Any; export default _default;
}

declare module "react-hook-form@7.55.0" {
  export * from "react-hook-form";
  const _default: Any; export default _default;
}

declare module "react-resizable-panels@2.1.7" {
  export * from "react-resizable-panels";
  const _default: Any; export default _default;
}

declare module "vaul@1.1.2" {
  export * from "vaul";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-dropdown-menu@2.1.6" {
  export * from "@radix-ui/react-dropdown-menu";
  const _default: Any; export default _default;
}

declare module "input-otp@1.4.2" {
  export * from "input-otp";
  const _default: Any; export default _default;
}

declare module "next-themes@0.4.6" {
  export * from "next-themes";
  const _default: Any; export default _default;
}

declare module "sonner@2.0.3" {
  export * from "sonner";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-select@2.1.6" {
  export * from "@radix-ui/react-select";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-scroll-area@1.2.3" {
  export * from "@radix-ui/react-scroll-area";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-checkbox@1.1.4" {
  export * from "@radix-ui/react-checkbox";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-collapsible@1.1.3" {
  export * from "@radix-ui/react-collapsible";
  const _default: Any; export default _default;
}

declare module "cmdk@1.1.1" {
  export * from "cmdk";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-context-menu@2.2.6" {
  export * from "@radix-ui/react-context-menu";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-dialog@1.1.6" {
  export * from "@radix-ui/react-dialog";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-hover-card@1.1.6" {
  export * from "@radix-ui/react-hover-card";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-label@2.1.2" {
  export * from "@radix-ui/react-label";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-menubar@1.1.6" {
  export * from "@radix-ui/react-menubar";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-navigation-menu@1.2.5" {
  export * from "@radix-ui/react-navigation-menu";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-popover@1.1.6" {
  export * from "@radix-ui/react-popover";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-slider@1.2.3" {
  export * from "@radix-ui/react-slider";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-progress@1.1.2" {
  export * from "@radix-ui/react-progress";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-radio-group@1.2.3" {
  export * from "@radix-ui/react-radio-group";
  const _default: Any; export default _default;
}

declare module "@radix-ui/react-accordion@1.2.3" {
  export * from "@radix-ui/react-accordion";
  const _default: Any; export default _default;
}

// Additional UI packages
declare module "@radix-ui/react-select@2.1.6" {
  export * from "@radix-ui/react-select";
  const _default: Any; export default _default;
}

declare module "react-resizable-panels@2.1.7" {
  export * from "react-resizable-panels";
  const _default: Any; export default _default;
}

// Mapping shortcuts used in supabase functions
declare module "npm:hono" {
  export * from "hono";
  const _default: Any; export default _default;
}

declare module "npm:hono/cors" {
  export * from "hono/cors";
  const _default: Any; export default _default;
}

declare module "npm:hono/logger" {
  export * from "hono/logger";
  const _default: Any; export default _default;
}

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
  const _default: Any; export default _default;
}

declare module "jsr:@supabase/supabase-js@2.49.8" {
  export * from "@supabase/supabase-js";
  const _default: Any; export default _default;
}

// Fallthrough - keep a generic module declaration for anything else
declare module "*@*" {
  const value: Any;
  export default value;
}

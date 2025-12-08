// Auto-generated helper types to work around workspace-specific import specifiers
// Some files contain package imports with an appended version (e.g. "lucide-react@0.487.0").
// Declare a wildcard module pattern so TypeScript doesn't error on those module specifiers.

declare module "*|@*";
declare module "*@*";
declare module "*/*@*";

declare module "react/jsx-runtime" {
  export {}; // allow implicit any for jsx runtime if not provided by @types/react
}

declare const Deno: any;

// also allow any other unknown modules
declare module "*" {
  const value: any;
  export default value;
}

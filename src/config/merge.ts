export type ConfigLayer = "defaults" | "repo" | "user" | "env" | "cli";

export interface ProvenanceEntry {
  value: unknown;
  layer: ConfigLayer;
  source?: string;
}

export type ProvenanceMap = Record<string, ProvenanceEntry>;

export interface LayerInput {
  config: Record<string, unknown>;
  layer: ConfigLayer;
  source?: string;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val === undefined) continue;
    if (isPlainObject(val) && isPlainObject(result[key])) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        val as Record<string, unknown>,
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

function mergeWithProvenance(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  prefix: string,
  provenance: ProvenanceMap,
  layer: ConfigLayer,
  sourceDesc?: string,
): void {
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(val) && isPlainObject(target[key])) {
      mergeWithProvenance(
        target[key] as Record<string, unknown>,
        val as Record<string, unknown>,
        path,
        provenance,
        layer,
        sourceDesc,
      );
    } else {
      target[key] = val;
    }
    provenance[path] = { value: val, layer, source: sourceDesc };
  }
}

export function mergeLayers(layers: LayerInput[]): {
  config: Record<string, unknown>;
  provenance: ProvenanceMap;
} {
  const config: Record<string, unknown> = {};
  const provenance: ProvenanceMap = {};
  for (const { config: layerConfig, layer, source } of layers) {
    mergeWithProvenance(config, layerConfig, "", provenance, layer, source);
  }
  return { config, provenance };
}

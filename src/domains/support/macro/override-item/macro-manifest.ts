import * as text from "../../../../kit/text.js";

/** Where a macro manifest is in its life cycle. */
export type MacroManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One macro manifest, with what the planners need to act on it. */
export class MacroManifest {
  code: string;
  label: string;
  currency: string;
  active: boolean;
  durationMinutes: number;
  variant: string;
  attributes: Map<string, string>;
  title: string;
  graceDays: number;
  source: string;
  windowDays: number;
  status: MacroManifestStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    active: boolean,
    durationMinutes: number,
    variant: string,
    attributes: Map<string, string>,
    title: string,
    graceDays: number,
    source: string,
    windowDays: number,
    status: MacroManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.active = active;
    this.durationMinutes = durationMinutes;
    this.variant = variant;
    this.attributes = attributes;
    this.title = title;
    this.graceDays = graceDays;
    this.source = source;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: MacroManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.windowDays + this.durationMinutes) * 100) / 100;
  }

  copy(): MacroManifest {
    return new MacroManifest(
      this.code,
      this.label,
      this.currency,
      this.active,
      this.durationMinutes,
      this.variant,
      this.attributes,
      this.title,
      this.graceDays,
      this.source,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a macro manifest in status new. */
export function newMacroManifest(code: string, label: string): MacroManifest {
  return new MacroManifest(code, label, "", false, 0, "", new Map<string, string>(), "", 0, "", 0, "new");
}

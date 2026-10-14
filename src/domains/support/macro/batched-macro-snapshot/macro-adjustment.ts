import * as text from "../../../../kit/text.js";

/** Where a macro adjustment is in its life cycle. */
export type MacroAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** One macro adjustment, with what the planners need to act on it. */
export class MacroAdjustment {
  code: string;
  title: string;
  variant: string;
  margin: number;
  description: string;
  summary: string;
  utmSource: string;
  endsAt: number;
  status: MacroAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    margin: number,
    description: string,
    summary: string,
    utmSource: string,
    endsAt: number,
    status: MacroAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.margin = margin;
    this.description = description;
    this.summary = summary;
    this.utmSource = utmSource;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: MacroAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round(this.margin * this.endsAt * 100) / 100;
  }

  copy(): MacroAdjustment {
    return new MacroAdjustment(
      this.code,
      this.title,
      this.variant,
      this.margin,
      this.description,
      this.summary,
      this.utmSource,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a macro adjustment in status created. */
export function newMacroAdjustment(code: string, title: string): MacroAdjustment {
  return new MacroAdjustment(code, title, "", 0, "", "", "", 0, "created");
}

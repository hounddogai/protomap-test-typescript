import * as text from "../../../../kit/text.js";

/** Where a fallback macro override is in its life cycle. */
export type FallbackMacroOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback macro override as the macro team keeps it. */
export class FallbackMacroOverride {
  code: string;
  title: string;
  ratio: number;
  utmSource: string;
  audienceId: string;
  source: string;
  batchSize: number;
  status: FallbackMacroOverrideStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    utmSource: string,
    audienceId: string,
    source: string,
    batchSize: number,
    status: FallbackMacroOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.utmSource = utmSource;
    this.audienceId = audienceId;
    this.source = source;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackMacroOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackMacroOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback macro override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback macro override"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.ratio + this.batchSize) * 100) / 100;
  }

  copy(): FallbackMacroOverride {
    return new FallbackMacroOverride(
      this.code,
      this.title,
      this.ratio,
      this.utmSource,
      this.audienceId,
      this.source,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback macro override in status requested. */
export function newFallbackMacroOverride(code: string, title: string): FallbackMacroOverride {
  return new FallbackMacroOverride(code, title, 0, "", "", "", 0, "requested");
}

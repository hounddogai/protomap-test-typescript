import * as text from "../../../../kit/text.js";

/** Where a default deflection digest is in its life cycle. */
export type DefaultDeflectionDigestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a default deflection digest and its current status. */
export class DefaultDeflectionDigest {
  code: string;
  name: string;
  variant: string;
  score: number;
  locale: string;
  ratio: number;
  expiresAt: number;
  status: DefaultDeflectionDigestStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    score: number,
    locale: string,
    ratio: number,
    expiresAt: number,
    status: DefaultDeflectionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.score = score;
    this.locale = locale;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultDeflectionDigestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: DefaultDeflectionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default deflection digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default deflection digest"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.expiresAt - this.ratio) * 100) / 100;
  }

  copy(): DefaultDeflectionDigest {
    return new DefaultDeflectionDigest(
      this.code,
      this.name,
      this.variant,
      this.score,
      this.locale,
      this.ratio,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default deflection digest in status open. */
export function newDefaultDeflectionDigest(code: string, name: string): DefaultDeflectionDigest {
  return new DefaultDeflectionDigest(code, name, "", 0, "", 0, 0, "open");
}

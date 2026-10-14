import * as text from "../../../../kit/text.js";

/** Where a lenient wait mapping is in its life cycle. */
export type LenientWaitMappingStatus = "created" | "validated" | "published" | "retired";

/** One lenient wait mapping, with what the planners need to act on it. */
export class LenientWaitMapping {
  code: string;
  name: string;
  sendAt: number;
  utmSource: string;
  label: string;
  status: LenientWaitMappingStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    utmSource: string,
    label: string,
    status: LenientWaitMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.utmSource = utmSource;
    this.label = label;
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

  canMoveTo(next: LenientWaitMappingStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientWaitMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient wait mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"lenient wait mapping"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): LenientWaitMapping {
    return new LenientWaitMapping(this.code, this.name, this.sendAt, this.utmSource, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient wait mapping in status created. */
export function newLenientWaitMapping(code: string, name: string): LenientWaitMapping {
  return new LenientWaitMapping(code, name, 0, "", "", "created");
}

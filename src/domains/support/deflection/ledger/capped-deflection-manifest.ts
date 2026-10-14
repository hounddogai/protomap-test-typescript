import * as text from "../../../../kit/text.js";

/** Where a capped deflection manifest is in its life cycle. */
export type CappedDeflectionManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped deflection manifest as the deflection team keeps it. */
export class CappedDeflectionManifest {
  code: string;
  title: string;
  archived: boolean;
  amount: number;
  timezone: string;
  label: string;
  status: CappedDeflectionManifestStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    amount: number,
    timezone: string,
    label: string,
    status: CappedDeflectionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.amount = amount;
    this.timezone = timezone;
    this.label = label;
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

  canMoveTo(next: CappedDeflectionManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CappedDeflectionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped deflection manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped deflection manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): CappedDeflectionManifest {
    return new CappedDeflectionManifest(
      this.code,
      this.title,
      this.archived,
      this.amount,
      this.timezone,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped deflection manifest in status open. */
export function newCappedDeflectionManifest(code: string, title: string): CappedDeflectionManifest {
  return new CappedDeflectionManifest(code, title, false, 0, "", "", "open");
}

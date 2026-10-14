/**
 * The frequency manifest records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency manifest is in its life cycle. */
export type FrequencyManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A frequency manifest as the frequency team keeps it. */
export class FrequencyManifest {
  code: string;
  title: string;
  visible: boolean;
  utmSource: string;
  audienceId: string;
  quantity: number;
  status: FrequencyManifestStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    utmSource: string,
    audienceId: string,
    quantity: number,
    status: FrequencyManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.utmSource = utmSource;
    this.audienceId = audienceId;
    this.quantity = quantity;
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

  canMoveTo(next: FrequencyManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FrequencyManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"frequency manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): FrequencyManifest {
    return new FrequencyManifest(
      this.code,
      this.title,
      this.visible,
      this.utmSource,
      this.audienceId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a frequency manifest in status new. */
export function newFrequencyManifest(code: string, title: string): FrequencyManifest {
  return new FrequencyManifest(code, title, false, "", "", 0, "new");
}

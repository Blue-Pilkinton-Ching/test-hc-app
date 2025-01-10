import {
  ActionHash,
  AppBundleSource,
  fakeActionHash,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeEntryHash,
  hashFrom32AndType,
  NewEntryAction,
  Record,
} from "@holochain/client";
import { CallableCell } from "@holochain/tryorama";

export async function sampleTextEntry(cell: CallableCell, partialTextEntry = {}) {
  return {
    ...{
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    },
    ...partialTextEntry,
  };
}

export async function createTextEntry(cell: CallableCell, textEntry = undefined): Promise<Record> {
  return cell.callZome({
    zome_name: "test_hc_app",
    fn_name: "create_text_entry",
    payload: textEntry || await sampleTextEntry(cell),
  });
}

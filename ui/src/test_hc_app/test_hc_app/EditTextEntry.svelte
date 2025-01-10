<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { TextEntry } from "./types";

let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);
const dispatch = createEventDispatcher();

export let currentRecord!: Record;
export let originalTextEntryHash!: ActionHash;

let currentTextEntry: TextEntry = decode((currentRecord.entry as any).Present.entry) as TextEntry;

$: ;
$: isTextEntryValid = true;

onMount(async () => {
  if (!currentRecord) {
    throw new Error(`The currentRecord input is required for the EditTextEntry element`);
  }
  if (!originalTextEntryHash) {
    throw new Error(`The originalTextEntryHash input is required for the EditTextEntry element`);
  }
  client = await appClientContext.getClient();
});

async function updateTextEntry() {
  const textEntry: TextEntry = {
    content: currentTextEntry.content,
  };

  try {
    const updateRecord: Record = await client.callZome({
      cap_secret: null,
      role_name: "test_hc_app",
      zome_name: "test_hc_app",
      fn_name: "update_text_entry",
      payload: {
        original_text_entry_hash: originalTextEntryHash,
        previous_text_entry_hash: currentRecord.signed_action.hashed.hash,
        updated_text_entry: textEntry,
      },
    });

    dispatch("text-entry-updated", { actionHash: updateRecord.signed_action.hashed.hash });
  } catch (e) {
    alert((e as HolochainError).message);
  }
}
</script>

<section>
  <div>
    <button on:click={() => dispatch("edit-canceled")}>Cancel</button>
    <button disabled={!isTextEntryValid} on:click={() => updateTextEntry()}>
      Edit TextEntry
    </button>
  </div>
</section>

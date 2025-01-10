<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import type { TextEntry } from "./types";

const dispatch = createEventDispatcher();
let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);

export let content!: string;

$: content;
$: isTextEntryValid = true;

onMount(async () => {
  if (content === undefined) {
    throw new Error(`The content input is required for the CreateTextEntry element`);
  }
  client = await appClientContext.getClient();
});

async function createTextEntry() {
  const textEntryEntry: TextEntry = {
    content: content!,
  };

  try {
    const record: Record = await client.callZome({
      cap_secret: null,
      role_name: "test_hc_app",
      zome_name: "test_hc_app",
      fn_name: "create_text_entry",
      payload: textEntryEntry,
    });
    dispatch("text-entry-created", { textEntryHash: record.signed_action.hashed.hash });
  } catch (e) {
    alert((e as HolochainError).message);
  }
}
</script>

<div>
  <h3>Create TextEntry</h3>

  <button disabled={!isTextEntryValid} on:click={() => createTextEntry()}>
    Create TextEntry
  </button>
</div>

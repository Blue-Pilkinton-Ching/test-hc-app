<script lang="ts">
import type { ActionHash, AgentPubKey, AppClient, DnaHash, EntryHash, HolochainError, Record } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { createEventDispatcher, getContext, onMount } from "svelte";
import { type ClientContext, clientContext } from "../../contexts";
import EditTextEntry from "./EditTextEntry.svelte";
import type { TextEntry } from "./types";

let client: AppClient;
const appClientContext = getContext<ClientContext>(clientContext);
const dispatch = createEventDispatcher();

let loading: boolean = false;
let editing = false;
let error: HolochainError | undefined;
let record: Record | undefined;
let textEntry: TextEntry | undefined;

export let textEntryHash: ActionHash;

$: editing, error, loading, record, textEntry;

onMount(async () => {
  if (textEntryHash === undefined) {
    throw new Error(`The textEntryHash input is required for the TextEntryDetail element`);
  }
  client = await appClientContext.getClient();
  await fetchTextEntry();
});

async function fetchTextEntry() {
  loading = true;
  try {
    record = await client.callZome({
      cap_secret: null,
      role_name: "test_hc_app",
      zome_name: "test_hc_app",
      fn_name: "get_latest_text_entry",
      payload: textEntryHash,
    });
    if (record) {
      textEntry = decode((record.entry as any).Present.entry) as TextEntry;
    }
  } catch (e) {
    error = e as HolochainError;
  } finally {
    loading = false;
  }
}

async function deleteTextEntry() {
  try {
    await client.callZome({
      cap_secret: null,
      role_name: "test_hc_app",
      zome_name: "test_hc_app",
      fn_name: "delete_text_entry",
      payload: textEntryHash,
    });
    dispatch("text-entry-deleted", { textEntryHash: textEntryHash });
  } catch (e) {
    alert((e as HolochainError).message);
  }
}
</script>

{#if loading}
  <progress />
{:else if error}
  <div class="alert">Error fetching the text entry: {error.message}</div>
{:else if editing}
  <EditTextEntry
    originalTextEntryHash={textEntryHash}
    currentRecord={record}
    on:text-entry-updated={async () => {
      editing = false;
      await fetchTextEntry();
    }}
    on:edit-canceled={() => {
      editing = false;
    }}
  />
{:else}
  <section>
    <div>
      <button
        on:click={() => {
          editing = true;
        }}
      >edit</button>
      <button on:click={() => deleteTextEntry()}>delete</button>
    </div>
  </section>
{/if}

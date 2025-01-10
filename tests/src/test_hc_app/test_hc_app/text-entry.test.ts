import { assert, test } from "vitest";

import {
  ActionHash,
  AppBundleSource,
  CreateLink,
  DeleteLink,
  fakeActionHash,
  fakeAgentPubKey,
  fakeEntryHash,
  Link,
  NewEntryAction,
  Record,
  SignedActionHashed,
} from "@holochain/client";
import { CallableCell, dhtSync, runScenario } from "@holochain/tryorama";
import { decode } from "@msgpack/msgpack";

import { createTextEntry, sampleTextEntry } from "./common.js";

test("create TextEntry", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/test-hc-app.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a TextEntry
    const record: Record = await createTextEntry(alice.cells[0]);
    assert.ok(record);
  });
});

test("create and read TextEntry", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/test-hc-app.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleTextEntry(alice.cells[0]);

    // Alice creates a TextEntry
    const record: Record = await createTextEntry(alice.cells[0], sample);
    assert.ok(record);

    // Wait for the created entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the created TextEntry
    const createReadOutput: Record = await bob.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "get_original_text_entry",
      payload: record.signed_action.hashed.hash,
    });
    assert.deepEqual(sample, decode((createReadOutput.entry as any).Present.entry) as any);
  });
});

test("create and update TextEntry", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/test-hc-app.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // Alice creates a TextEntry
    const record: Record = await createTextEntry(alice.cells[0]);
    assert.ok(record);

    const originalActionHash = record.signed_action.hashed.hash;

    // Alice updates the TextEntry
    let contentUpdate: any = await sampleTextEntry(alice.cells[0]);
    let updateInput = {
      original_text_entry_hash: originalActionHash,
      previous_text_entry_hash: originalActionHash,
      updated_text_entry: contentUpdate,
    };

    let updatedRecord: Record = await alice.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "update_text_entry",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the updated TextEntry
    const readUpdatedOutput0: Record = await bob.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "get_latest_text_entry",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput0.entry as any).Present.entry) as any);

    // Alice updates the TextEntry again
    contentUpdate = await sampleTextEntry(alice.cells[0]);
    updateInput = {
      original_text_entry_hash: originalActionHash,
      previous_text_entry_hash: updatedRecord.signed_action.hashed.hash,
      updated_text_entry: contentUpdate,
    };

    updatedRecord = await alice.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "update_text_entry",
      payload: updateInput,
    });
    assert.ok(updatedRecord);

    // Wait for the updated entry to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the updated TextEntry
    const readUpdatedOutput1: Record = await bob.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "get_latest_text_entry",
      payload: updatedRecord.signed_action.hashed.hash,
    });
    assert.deepEqual(contentUpdate, decode((readUpdatedOutput1.entry as any).Present.entry) as any);

    // Bob gets all the revisions for TextEntry
    const revisions: Record[] = await bob.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "get_all_revisions_for_text_entry",
      payload: originalActionHash,
    });
    assert.equal(revisions.length, 3);
    assert.deepEqual(contentUpdate, decode((revisions[2].entry as any).Present.entry) as any);
  });
});

test("create and delete TextEntry", async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + "/../workdir/test-hc-app.happ";

    // Set up the app to be installed
    const appSource = { appBundleSource: { path: testAppPath } };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const sample = await sampleTextEntry(alice.cells[0]);

    // Alice creates a TextEntry
    const record: Record = await createTextEntry(alice.cells[0], sample);
    assert.ok(record);

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Alice deletes the TextEntry
    const deleteActionHash = await alice.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "delete_text_entry",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(deleteActionHash);

    // Wait for the entry deletion to be propagated to the other node.
    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Bob gets the oldest delete for the TextEntry
    const oldestDeleteForTextEntry: SignedActionHashed = await bob.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "get_oldest_delete_for_text_entry",
      payload: record.signed_action.hashed.hash,
    });
    assert.ok(oldestDeleteForTextEntry);

    // Bob gets the deletions for the TextEntry
    const deletesForTextEntry: SignedActionHashed[] = await bob.cells[0].callZome({
      zome_name: "test_hc_app",
      fn_name: "get_all_deletes_for_text_entry",
      payload: record.signed_action.hashed.hash,
    });
    assert.equal(deletesForTextEntry.length, 1);
  });
});

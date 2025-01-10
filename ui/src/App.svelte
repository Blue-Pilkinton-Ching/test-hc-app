<script lang="ts">
  import type { AppClient, HolochainError, Record } from '@holochain/client'
  import {
    AppWebsocket,
    decodeHashFromBase64,
    encodeHashToBase64,
  } from '@holochain/client'
  import { onMount, setContext } from 'svelte'

  import { type ClientContext, clientContext } from './contexts'
  import { decode } from '@msgpack/msgpack'

  import type { TestEntry } from './types'

  let client: AppWebsocket | undefined
  let error: HolochainError | undefined
  let text = ''
  let loading = false
  let record: Record | undefined
  let testEntry: TestEntry | undefined

  const appClientContext = {
    getClient: async () => {
      if (!client) {
        client = await AppWebsocket.connect()
      }
      return client
    },
  }

  onMount(async () => {
    try {
      loading = true
      client = await appClientContext.getClient()
    } catch (e) {
      error = e as HolochainError
    } finally {
      loading = false
    }
  })

  setContext<ClientContext>(clientContext, appClientContext)

  async function createTestEntry() {
    let record: Record
    loading = true

    try {
      record = await client.callZome({
        cap_secret: null,
        role_name: 'test_hc_app',
        zome_name: 'test_hc_app',
        fn_name: 'create_text_entry',
        payload: {
          content: 'test',
        },
      })

      console.log(encodeHashToBase64(record.signed_action.hashed.hash))
    } catch (e) {
      alert((e as HolochainError).message)
    } finally {
      loading = false
    }

    return record
  }

  async function fetchTestEntry() {
    loading = true
    try {
      record = await client.callZome({
        cap_secret: null,
        role_name: 'test_hc_app',
        zome_name: 'test_hc_app',
        fn_name: 'get_original_text_entry',
        payload: decodeHashFromBase64(text),
      })

      if (record === null) {
        // This executes unless I add a delay after joining the network
        console.error('Record is null!')
      }

      testEntry = decode((record.entry as any).Present.entry) as TestEntry
      console.log(testEntry)
      console.log(record)
    } catch (e) {
      alert((e as HolochainError).message)
    } finally {
      loading = false
    }
  }

  async function joinNetwork() {
    if (!client) {
      return
    }
    await client.provideMemproofs({})

    await client.enableApp()

    await client.appInfo()

    if (text) {
      // So here is the problem.
      // If we call fetchTestEntry() directly after joining the network, I get an alert with the error:
      // "Cannot read properties of undefined (reading 'entry')" which bassically means the call

      // If I uncomment this delay here, it works fine.
      // In my production app, I'm retrieving 10s of records right after the agent joins the network,
      // and need to no how long I should wait.

      await new Promise((resolve) => setTimeout(resolve, 3000))

      fetchTestEntry()
    } else {
      createTestEntry()
    }
  }
</script>

<main>
  {#if loading}
    <p>Loading...</p>
  {:else}
    <p>Hash</p>
    <input type="text" bind:value={text} />
    <button on:click={joinNetwork}>Join network</button>
  {/if}
</main>

<script lang="ts">
  import type { AppClient, HolochainError, Record } from '@holochain/client'
  import { AppWebsocket } from '@holochain/client'
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

  async function fetchTestEntry() {
    loading = true
    try {
      record = await client.callZome({
        cap_secret: null,
        role_name: 'test_dna',
        zome_name: 'test_dna',
        fn_name: 'get_latest_test_entry',
        payload: text,
      })
      if (record) {
        testEntry = decode((record.entry as any).Present.entry) as TestEntry
      }
    } catch (e) {
      error = e as HolochainError
    } finally {
      loading = false
    }
  }

  async function createTestEntry() {
    let record: Record
    try {
      record = await client.callZome({
        cap_secret: null,
        role_name: 'test_dna',
        zome_name: 'test_dna',
        fn_name: 'create_test_entry',
        payload: {
          test_feild: 'test',
        },
      })
    } catch (e) {
      alert((e as HolochainError).message)
    }

    return record
  }

  async function joinNetwork() {
    if (!client) {
      return
    }
    await client.provideMemproofs({})

    await client.enableApp()

    if (text) {
    } else {
    }
  }
</script>

<main>
  {#if loading}
    <p>Loading...</p>
  {:else}
    <p>Hash</p>
    <input type="text" />
    <button on:click={joinNetwork}>Join network</button>
  {/if}
</main>

<template>
    <table-tx/>
</template>

<script>
import TableTx from '~/components/TableTx'

export default {
    components: {
        TableTx
    },
    mounted () {
        // Init breadcrumbs data.
        this.$store.commit('breadcrumb/setItems', { name: 'txs', to: { name: 'txs' } })
    },
    head: () => ({
        title: 'Transactions'
    })
}
</script>

<style scoped>

</style>

<script setup lang="ts">
// import Todos from './components/Todos.vue'
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

import Grid from './components/Grid.vue'
</script>

<template>
  <main>
    <!-- <Todos /> -->
    <Grid :count="60" />
        
    <!-- <authenticator>
      <template v-slot="{ signOut }">
        
        <button @click="signOut">Sign Out</button>
      </template> -->
    <!-- </authenticator> -->
  </main>
</template>


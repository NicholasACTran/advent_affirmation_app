<script setup lang="ts">
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";
import CalendarList from './components/CalendarList.vue';
import Grid from './components/Grid.vue';
import { computed, ref } from 'vue';

const auth = useAuthenticator();

const profileOwner = computed(() => {
  return auth.user?.userId || auth.user?.username || '';
});

// State for managing which view to show
const selectedCalendarId = ref<string | null>(null);
const selectedCount = ref<number>(0);

// Handler for opening a calendar
const handleOpenCalendar = (payload: { calendarId: string; count: number }) => {
  selectedCalendarId.value = payload.calendarId;
  selectedCount.value = payload.count;
};

// Handler for closing the grid view
const handleCloseGrid = () => {
  selectedCalendarId.value = null;
  selectedCount.value = 0;
};
</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ user, signOut }">
        <!-- Show Grid if a calendar is selected, otherwise show CalendarList -->
        <Grid 
          v-if="selectedCalendarId" 
          :calendarId="selectedCalendarId"
          :count="selectedCount"
          @close="handleCloseGrid"
        />
        <CalendarList 
          v-else
          :profileOwner="user.userId"
          @openCalendar="handleOpenCalendar"
        />
        <button @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </main>
</template>
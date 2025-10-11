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
const selectedStartDate = ref<string>("");

// Handler for opening a calendar
const handleOpenCalendar = (payload: { calendarId: string; count: number; startDate: string }) => {
  selectedCalendarId.value = payload.calendarId;
  selectedCount.value = payload.count;
  selectedStartDate.value = payload.startDate;
};

// Handler for closing the grid view
const handleCloseGrid = () => {
  selectedCalendarId.value = null;
  selectedCount.value = 0;
  selectedStartDate.value = "";
};
</script>

<template>
  <main>
    <authenticator>
      <template v-slot="{ user, signOut }">
        <div class="app-container">
          <!-- Sign Out Button in top-right corner -->
          <header class="app-header">
            <button @click="signOut" class="sign-out-button">Sign Out</button>
          </header>

          <!-- Main Content -->
          <div class="app-content">
            <Grid
              v-if="selectedCalendarId"
              :calendarId="selectedCalendarId"
              :count="selectedCount"
              :startDate="selectedStartDate"
              @close="handleCloseGrid"
            />
            <CalendarList
              v-else
              :profileOwner="user.userId"
              @openCalendar="handleOpenCalendar"
            />
          </div>
        </div>
      </template>
    </authenticator>
  </main>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  position: relative;
}

.app-header {
  position: fixed;
  top: 0;
  right: 0;
  padding: 1rem;
  z-index: 100;
}

.sign-out-button {
  padding: 0.5rem 1.25rem;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sign-out-button:hover {
  background-color: #dc2626;
}

.sign-out-button:active {
  transform: scale(0.98);
}

.app-content {
  padding-top: 1rem;
}
</style>
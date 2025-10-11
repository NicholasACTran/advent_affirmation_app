<script setup lang="ts">
import "@/assets/CalendarList.css";
import { ref, onMounted, watch } from "vue";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

interface Props {
  profileOwner: string;
}

const props = defineProps<Props>();

// Define emit for opening calendar
const emit = defineEmits<{
  openCalendar: [payload: { calendarId: string; count: number, startDate: string }];
}>();

const calendars = ref<Schema["Calendar"]["type"][]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Handler for opening a calendar
const openCalendar = (calendarId: string, count: number, startDate: string) => {
  emit("openCalendar", { calendarId, count, startDate });
};

const fetchCalendars = async () => {
  loading.value = true;
  error.value = null;
  console.log(props);

  try {
    // Query calendars where the user is the receiver
    const { data, errors } = await client.models.Calendar.list({
      authMode: "userPool",
      filter: {
        receiverId: {
          eq: props.profileOwner,
        },
      },
    });

    if (errors) {
      console.error("Errors fetching calendars:", errors);
      error.value = "Failed to load calendars";
    } else {
      calendars.value = data;
      console.log(data);
    }
  } catch (e) {
    error.value = "Failed to load calendars";
    console.error("Error fetching calendars:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCalendars();
});

// Re-fetch when profileOwner changes
watch(
  () => props.profileOwner,
  () => {
    fetchCalendars();
  }
);
</script>

<template>
  <div class="calendar-list">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>

      <p>Loading calendars...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>

      <button @click="fetchCalendars" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="calendars.length === 0" class="empty">
      <p>No calendars found</p>

      <p class="empty-subtitle">You haven't received any advent calendars yet</p>
    </div>

    <div v-else class="calendar-grid">
      <div v-for="calendar in calendars" :key="calendar.id" class="calendar-card">
        <div class="card-header">
          <h3 class="calendar-title">{{ calendar.title || "Untitled Calendar" }}</h3>

          <span class="affirmation-badge">
            {{ calendar.currentAffirmation }}/{{ calendar.numOfAffirmations }}
          </span>
        </div>

        <div class="card-body">
          <p class="calendar-message" v-if="calendar.message">
            {{ calendar.message }}
          </p>
        </div>

        <div class="card-footer">
          <button class="open-btn" @click="openCalendar(calendar.id, calendar.numOfAffirmations, calendar.startDate)">
            Open Calendar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

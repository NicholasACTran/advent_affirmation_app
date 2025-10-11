<script setup lang="ts">
import "@/assets/grid.css";
import { ref, computed, onMounted, watch } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface Props {
  calendarId: string;
  count: number;
  startDate: string; // AWSDate format: "YYYY-MM-DD"
}

const props = defineProps<Props>();

const emit = defineEmits<{
  squareClicked: [squareNumber: number];
  close: [];
}>();

// Component state
const currentPage = ref(1);
const squaresPerPage = 30;
const affirmations = ref<Schema['Affirmation']['type'][]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Modal state
const showModal = ref(false);
const selectedAffirmation = ref<string>('');
const selectedDay = ref<number>(0);
const updatingAffirmation = ref(false);

// Calculate days since start date
const daysSinceStartDate = computed(() => {
  const start = new Date(props.startDate);
  const today = new Date();
  
  // Reset time to midnight for accurate day counting
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Maximum day that can be opened
const maxAvailableDay = computed(() => {
  return daysSinceStartDate.value + 1;
});

// Computed properties
const totalPages = computed(() => {
  return Math.ceil(props.count / squaresPerPage);
});

const paginatedSquares = computed(() => {
  const startIndex = (currentPage.value - 1) * squaresPerPage;
  const endIndex = Math.min(startIndex + squaresPerPage, props.count);
  const squares = [];
  
  for (let i = startIndex + 1; i <= endIndex; i++) {
    squares.push(i);
  }
  
  return squares;
});

// Check if a square/day is available to open
const isDayAvailable = (day: number) => {
  return day <= maxAvailableDay.value;
};

// Get affirmation for a specific day
const getAffirmation = (day: number) => {
  return affirmations.value.find(a => a.day === day);
};

// Get the color class for a square based on affirmation type and opened status
const getSquareColorClass = (day: number) => {
  const affirmation = getAffirmation(day);
  
  if (!affirmation) {
    return 'square-default';
  }
  
  const type = affirmation.type?.toUpperCase();
  const isOpened = affirmation.opened && affirmation.opened.length > 0;
  
  if (type === 'PLATONIC') {
    return isOpened ? 'square-platonic-opened' : 'square-platonic-unopened';
  } else if (type === 'ROMANTIC') {
    return 'square-romantic';
  } else if (type === 'NSFW') {
    return 'square-nsfw';
  }
  
  return 'square-default';
};

// Fetch affirmations from Amplify
const fetchAffirmations = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const { data, errors } = await client.models.Affirmation.list({
      authMode: 'userPool',
      filter: {
        calendarId: {
          eq: props.calendarId
        },
        day: {
          le: maxAvailableDay.value
        }
      },
    });
    
    if (errors) {
      console.error('Errors fetching affirmations:', errors);
      error.value = 'Failed to load affirmations';
    } else {
      affirmations.value = data;
      console.log('Loaded affirmations:', data);
      console.log('Days since start date:', daysSinceStartDate.value);
      console.log('Max available day:', maxAvailableDay.value);
    }
  } catch (e) {
    error.value = 'Failed to load affirmations';
    console.error('Error fetching affirmations:', e);
  } finally {
    loading.value = false;
  }
};

// Update affirmation's opened array
const updateAffirmationOpened = async (affirmation: Schema['Affirmation']['type']) => {
  updatingAffirmation.value = true;
  
  try {
    const currentDateTime = new Date().toISOString();
    const updatedOpenedArray = [...(affirmation.opened || []), currentDateTime];
    
    const { data, errors } = await client.models.Affirmation.update({
      calendarId: affirmation.calendarId,
      day: affirmation.day,
      opened: updatedOpenedArray
    }, {
      authMode: 'userPool'
    });
    
    if (errors) {
      console.error('Error updating affirmation:', errors);
    } else {
      console.log('Successfully updated affirmation opened time');
      
      // Update local state
      const index = affirmations.value.findIndex(
        a => a.calendarId === affirmation.calendarId && a.day === affirmation.day
      );
      if (index !== -1 && data) {
        affirmations.value[index] = data;
      }
    }
  } catch (e) {
    console.error('Failed to update affirmation:', e);
  } finally {
    updatingAffirmation.value = false;
  }
};

// Methods
const handleClick = async (squareNumber: number) => {
  // Check if the day is available to open
  if (!isDayAvailable(squareNumber)) {
    alert(`Day ${squareNumber} is not available yet. Come back on ${getAvailableDate(squareNumber)}!`);
    return;
  }
  
  emit('squareClicked', squareNumber);
  
  // Find the affirmation for this day
  const affirmation = affirmations.value.find(a => a.day === squareNumber);
  if (affirmation && affirmation.message) {
    selectedAffirmation.value = affirmation.message;
    selectedDay.value = squareNumber;
    showModal.value = true;
    
    // Update the opened array in the background
    await updateAffirmationOpened(affirmation);
  } else {
    selectedAffirmation.value = 'No affirmation available for this day.';
    selectedDay.value = squareNumber;
    showModal.value = true;
  }
};

// Get the date when a specific day will be available
const getAvailableDate = (day: number) => {
  const start = new Date(props.startDate);
  start.setDate(start.getDate() + day - 1);
  return start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const closeModal = () => {
  showModal.value = false;
  selectedAffirmation.value = '';
  selectedDay.value = 0;
};

const goToPage = (pageNumber: number) => {
  currentPage.value = pageNumber;
};

// Fetch affirmations on mount
onMounted(() => {
  fetchAffirmations();
});

// Re-fetch if calendarId or startDate changes
watch([() => props.calendarId, () => props.startDate], () => {
  fetchAffirmations();
});
</script>

<template>
  <div class="square-grid-container">
    <!-- Close button at top-left -->
    <header class="grid-header">
      <button @click="emit('close')" class="close-button">
        ← Back to Calendars
      </button>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <p>Loading affirmations...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchAffirmations">Retry</button>
    </div>
    
    <!-- Grid content -->
    <template v-else>
      <div class="pagination">
        <button 
          v-for="page in totalPages" 
          :key="page" 
          class="page-button" 
          :class="{ active: page === currentPage }" 
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <div class="square-grid">
        <div 
          v-for="square in paginatedSquares" 
          :key="square" 
          class="square" 
          :class="[
            getSquareColorClass(square),
            { 
              'square-locked': !isDayAvailable(square),
              'square-available': isDayAvailable(square)
            }
          ]"
          @click="handleClick(square)"
        >
          {{ square }}
          <span v-if="!isDayAvailable(square)" class="lock-icon">🔒</span>
        </div>
      </div>
    </template>
    
    <!-- Affirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click="closeModal">
          <div class="modal-container" @click.stop>
            <div class="modal-header">
              <h2>Day {{ selectedDay }}</h2>
              <button class="modal-close" @click="closeModal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="affirmation-text">{{ selectedAffirmation }}</p>
            </div>
            <div class="modal-footer">
              <button class="modal-button" @click="closeModal">Close</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
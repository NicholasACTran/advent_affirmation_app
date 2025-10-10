<script setup lang="ts">
import "@/assets/grid.css";
import { ref, computed, onMounted, watch } from 'vue';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface Props {
  calendarId: string;
  count: number;
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
        }
      }
    });
    
    if (errors) {
      console.error('Errors fetching affirmations:', errors);
      error.value = 'Failed to load affirmations';
    } else {
      affirmations.value = data;
      console.log('Loaded affirmations:', data);
    }
  } catch (e) {
    error.value = 'Failed to load affirmations';
    console.error('Error fetching affirmations:', e);
  } finally {
    loading.value = false;
  }
};

// Methods
const handleClick = (squareNumber: number) => {
  emit('squareClicked', squareNumber);
  console.log(`Square ${squareNumber} clicked`);
  
  // Find the affirmation for this day
  const affirmation = affirmations.value.find(a => a.day === squareNumber);
  if (affirmation) {
    console.log('Affirmation:', affirmation.message);
  }
};

const goToPage = (pageNumber: number) => {
  currentPage.value = pageNumber;
};

// Fetch affirmations on mount
onMounted(() => {
  fetchAffirmations();
});

// Re-fetch if calendarId changes
watch(() => props.calendarId, () => {
  fetchAffirmations();
});
</script>

<template>
  <div class="square-grid-container">
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
          @click="handleClick(square)"
        >
          {{ square }}
        </div>
      </div>
      
      <!-- Back button to return to calendar list -->
      <div class="actions">
        <button @click="emit('close')" class="back-button">
          Back to Calendars
        </button>
      </div>
    </template>
  </div>
</template>
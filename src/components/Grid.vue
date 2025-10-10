<script lang="ts">
import "@/assets/grid.css"

  export default {
    name: 'Grid',
    props: {
      count: {
        type: Number,
        required: true,
        default: 0
      }
    },
    data() {
      return {
        currentPage: 1,
        squaresPerPage: 30
      };
    },
    computed: {
      totalPages() {
        return Math.ceil(this.count / this.squaresPerPage);
      },
      paginatedSquares() {
        const startIndex = (this.currentPage - 1) * this.squaresPerPage;
        const endIndex = Math.min(startIndex + this.squaresPerPage, this.count);
        const squares = [];
        for (let i = startIndex + 1; i <= endIndex; i++) {
          squares.push(i);
        }
        return squares;
      }
    },
    methods: {
      handleClick(squareNumber : string) {
        this.$emit('square-clicked', squareNumber);
        console.log(`Square ${squareNumber} clicked`);
      },
      goToPage(pageNumber : string) {
        this.currentPage = pageNumber;
      }
    }
  };
</script>

<template>
    <div class="square-grid-container">
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
    </div>
</template>
  
  <!-- <style src="@/assets/grid.css"></style> -->
  
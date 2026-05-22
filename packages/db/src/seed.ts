import { config } from 'dotenv'
import { resolve } from 'path'

// Must run before importing client.ts — that module reads DATABASE_URL at init time
config({ path: resolve(__dirname, '../../../apps/web/.env.local') })

const seedQuestions = [
  // Arrays / Hashing
  { title: 'Contains Duplicate', link: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'easy', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Valid Anagram', link: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'easy', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Two Sum', link: 'https://leetcode.com/problems/two-sum/', difficulty: 'easy', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 15 },
  { title: 'Group Anagrams', link: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Top K Frequent Elements', link: 'https://leetcode.com/problems/top-k-frequent-elements/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: ['heap'], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Product of Array Except Self', link: 'https://leetcode.com/problems/product-of-array-except-self/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Longest Consecutive Sequence', link: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Valid Sudoku', link: 'https://leetcode.com/problems/valid-sudoku/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 25 },

  // Two Pointers
  { title: 'Valid Palindrome', link: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'easy', primaryPattern: 'two_pointers', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Two Sum II - Input Array Is Sorted', link: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', difficulty: 'medium', primaryPattern: 'two_pointers', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 15 },
  { title: '3Sum', link: 'https://leetcode.com/problems/3sum/', difficulty: 'medium', primaryPattern: 'two_pointers', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Container With Most Water', link: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium', primaryPattern: 'two_pointers', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 20 },
  { title: 'Trapping Rain Water', link: 'https://leetcode.com/problems/trapping-rain-water/', difficulty: 'hard', primaryPattern: 'two_pointers', secondaryPatterns: ['monotonic_stack'], importanceScore: 10, estimatedMinutes: 35 },

  // Sliding Window
  { title: 'Best Time to Buy and Sell Stock', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'easy', primaryPattern: 'sliding_window', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 15 },
  { title: 'Longest Substring Without Repeating Characters', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'medium', primaryPattern: 'sliding_window', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 20 },
  { title: 'Longest Repeating Character Replacement', link: 'https://leetcode.com/problems/longest-repeating-character-replacement/', difficulty: 'medium', primaryPattern: 'sliding_window', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Permutation in String', link: 'https://leetcode.com/problems/permutation-in-string/', difficulty: 'medium', primaryPattern: 'sliding_window', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Minimum Window Substring', link: 'https://leetcode.com/problems/minimum-window-substring/', difficulty: 'hard', primaryPattern: 'sliding_window', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 40 },
  { title: 'Sliding Window Maximum', link: 'https://leetcode.com/problems/sliding-window-maximum/', difficulty: 'hard', primaryPattern: 'sliding_window', secondaryPatterns: ['monotonic_stack'], importanceScore: 9, estimatedMinutes: 35 },

  // Stack
  { title: 'Valid Parentheses', link: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'easy', primaryPattern: 'stack', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 10 },
  { title: 'Min Stack', link: 'https://leetcode.com/problems/min-stack/', difficulty: 'medium', primaryPattern: 'stack', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 15 },
  { title: 'Evaluate Reverse Polish Notation', link: 'https://leetcode.com/problems/evaluate-reverse-polish-notation/', difficulty: 'medium', primaryPattern: 'stack', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 20 },
  { title: 'Generate Parentheses', link: 'https://leetcode.com/problems/generate-parentheses/', difficulty: 'medium', primaryPattern: 'stack', secondaryPatterns: ['backtracking'], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Daily Temperatures', link: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'medium', primaryPattern: 'monotonic_stack', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Car Fleet', link: 'https://leetcode.com/problems/car-fleet/', difficulty: 'medium', primaryPattern: 'monotonic_stack', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 25 },
  { title: 'Largest Rectangle in Histogram', link: 'https://leetcode.com/problems/largest-rectangle-in-histogram/', difficulty: 'hard', primaryPattern: 'monotonic_stack', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 40 },

  // Binary Search
  { title: 'Binary Search', link: 'https://leetcode.com/problems/binary-search/', difficulty: 'easy', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Search a 2D Matrix', link: 'https://leetcode.com/problems/search-a-2d-matrix/', difficulty: 'medium', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Koko Eating Bananas', link: 'https://leetcode.com/problems/koko-eating-bananas/', difficulty: 'medium', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Find Minimum in Rotated Sorted Array', link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'medium', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Search in Rotated Sorted Array', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', difficulty: 'medium', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Time Based Key-Value Store', link: 'https://leetcode.com/problems/time-based-key-value-store/', difficulty: 'medium', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Median of Two Sorted Arrays', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', difficulty: 'hard', primaryPattern: 'binary_search', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 45 },

  // Linked List
  { title: 'Reverse Linked List', link: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'easy', primaryPattern: 'linked_list', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 15 },
  { title: 'Merge Two Sorted Lists', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', difficulty: 'easy', primaryPattern: 'linked_list', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 15 },
  { title: 'Linked List Cycle', link: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'easy', primaryPattern: 'linked_list', secondaryPatterns: ['two_pointers'], importanceScore: 9, estimatedMinutes: 15 },
  { title: 'Reorder List', link: 'https://leetcode.com/problems/reorder-list/', difficulty: 'medium', primaryPattern: 'linked_list', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Remove Nth Node From End of List', link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', difficulty: 'medium', primaryPattern: 'linked_list', secondaryPatterns: ['two_pointers'], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Copy List with Random Pointer', link: 'https://leetcode.com/problems/copy-list-with-random-pointer/', difficulty: 'medium', primaryPattern: 'linked_list', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Add Two Numbers', link: 'https://leetcode.com/problems/add-two-numbers/', difficulty: 'medium', primaryPattern: 'linked_list', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Find the Duplicate Number', link: 'https://leetcode.com/problems/find-the-duplicate-number/', difficulty: 'medium', primaryPattern: 'linked_list', secondaryPatterns: ['two_pointers'], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'LRU Cache', link: 'https://leetcode.com/problems/lru-cache/', difficulty: 'medium', primaryPattern: 'linked_list', secondaryPatterns: ['arrays_hashing'], importanceScore: 10, estimatedMinutes: 35 },
  { title: 'Merge K Sorted Lists', link: 'https://leetcode.com/problems/merge-k-sorted-lists/', difficulty: 'hard', primaryPattern: 'linked_list', secondaryPatterns: ['heap'], importanceScore: 10, estimatedMinutes: 40 },
  { title: 'Reverse Nodes in K-Group', link: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', difficulty: 'hard', primaryPattern: 'linked_list', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 40 },

  // Trees
  { title: 'Invert Binary Tree', link: 'https://leetcode.com/problems/invert-binary-tree/', difficulty: 'easy', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Maximum Depth of Binary Tree', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'easy', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Diameter of Binary Tree', link: 'https://leetcode.com/problems/diameter-of-binary-tree/', difficulty: 'easy', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 15 },
  { title: 'Balanced Binary Tree', link: 'https://leetcode.com/problems/balanced-binary-tree/', difficulty: 'easy', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 15 },
  { title: 'Same Tree', link: 'https://leetcode.com/problems/same-tree/', difficulty: 'easy', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 10 },
  { title: 'Subtree of Another Tree', link: 'https://leetcode.com/problems/subtree-of-another-tree/', difficulty: 'easy', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 15 },
  { title: 'Lowest Common Ancestor of a BST', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Binary Tree Level Order Traversal', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 20 },
  { title: 'Binary Tree Right Side View', link: 'https://leetcode.com/problems/binary-tree-right-side-view/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Count Good Nodes in Binary Tree', link: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 20 },
  { title: 'Validate Binary Search Tree', link: 'https://leetcode.com/problems/validate-binary-search-tree/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Kth Smallest Element in a BST', link: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Construct Binary Tree from Preorder and Inorder', link: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/', difficulty: 'medium', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Binary Tree Maximum Path Sum', link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/', difficulty: 'hard', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 40 },
  { title: 'Serialize and Deserialize Binary Tree', link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', difficulty: 'hard', primaryPattern: 'trees', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 45 },

  // Trie
  { title: 'Implement Trie (Prefix Tree)', link: 'https://leetcode.com/problems/implement-trie-prefix-tree/', difficulty: 'medium', primaryPattern: 'trie', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Design Add and Search Words Data Structure', link: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', difficulty: 'medium', primaryPattern: 'trie', secondaryPatterns: ['backtracking'], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Word Search II', link: 'https://leetcode.com/problems/word-search-ii/', difficulty: 'hard', primaryPattern: 'trie', secondaryPatterns: ['backtracking'], importanceScore: 8, estimatedMinutes: 50 },

  // Heap / Priority Queue
  { title: 'Kth Largest Element in a Stream', link: 'https://leetcode.com/problems/kth-largest-element-in-a-stream/', difficulty: 'easy', primaryPattern: 'heap', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 20 },
  { title: 'Last Stone Weight', link: 'https://leetcode.com/problems/last-stone-weight/', difficulty: 'easy', primaryPattern: 'heap', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 15 },
  { title: 'K Closest Points to Origin', link: 'https://leetcode.com/problems/k-closest-points-to-origin/', difficulty: 'medium', primaryPattern: 'heap', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Kth Largest Element in an Array', link: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'medium', primaryPattern: 'heap', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Task Scheduler', link: 'https://leetcode.com/problems/task-scheduler/', difficulty: 'medium', primaryPattern: 'heap', secondaryPatterns: ['greedy'], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Design Twitter', link: 'https://leetcode.com/problems/design-twitter/', difficulty: 'medium', primaryPattern: 'heap', secondaryPatterns: ['linked_list'], importanceScore: 7, estimatedMinutes: 35 },
  { title: 'Find Median from Data Stream', link: 'https://leetcode.com/problems/find-median-from-data-stream/', difficulty: 'hard', primaryPattern: 'heap', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 40 },

  // Backtracking
  { title: 'Subsets', link: 'https://leetcode.com/problems/subsets/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Combination Sum', link: 'https://leetcode.com/problems/combination-sum/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Combination Sum II', link: 'https://leetcode.com/problems/combination-sum-ii/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Permutations', link: 'https://leetcode.com/problems/permutations/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Subsets II', link: 'https://leetcode.com/problems/subsets-ii/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Word Search', link: 'https://leetcode.com/problems/word-search/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 30 },
  { title: 'Palindrome Partitioning', link: 'https://leetcode.com/problems/palindrome-partitioning/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: ['dp'], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Letter Combinations of a Phone Number', link: 'https://leetcode.com/problems/letter-combinations-of-a-phone-number/', difficulty: 'medium', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'N-Queens', link: 'https://leetcode.com/problems/n-queens/', difficulty: 'hard', primaryPattern: 'backtracking', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 40 },

  // Graphs
  { title: 'Number of Islands', link: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Max Area of Island', link: 'https://leetcode.com/problems/max-area-of-island/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Clone Graph', link: 'https://leetcode.com/problems/clone-graph/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Walls and Gates', link: 'https://leetcode.com/problems/walls-and-gates/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Rotting Oranges', link: 'https://leetcode.com/problems/rotting-oranges/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Pacific Atlantic Water Flow', link: 'https://leetcode.com/problems/pacific-atlantic-water-flow/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Surrounded Regions', link: 'https://leetcode.com/problems/surrounded-regions/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 25 },
  { title: 'Course Schedule', link: 'https://leetcode.com/problems/course-schedule/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 30 },
  { title: 'Course Schedule II', link: 'https://leetcode.com/problems/course-schedule-ii/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 30 },
  { title: 'Graph Valid Tree', link: 'https://leetcode.com/problems/graph-valid-tree/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: ['union_find'], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Number of Connected Components in Undirected Graph', link: 'https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: ['union_find'], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Redundant Connection', link: 'https://leetcode.com/problems/redundant-connection/', difficulty: 'medium', primaryPattern: 'union_find', secondaryPatterns: ['graphs'], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Word Ladder', link: 'https://leetcode.com/problems/word-ladder/', difficulty: 'hard', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 40 },

  // Advanced Graphs
  { title: 'Reconstruct Itinerary', link: 'https://leetcode.com/problems/reconstruct-itinerary/', difficulty: 'hard', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 40 },
  { title: 'Min Cost to Connect All Points', link: 'https://leetcode.com/problems/min-cost-to-connect-all-points/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 35 },
  { title: 'Network Delay Time', link: 'https://leetcode.com/problems/network-delay-time/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 35 },
  { title: 'Swim in Rising Water', link: 'https://leetcode.com/problems/swim-in-rising-water/', difficulty: 'hard', primaryPattern: 'graphs', secondaryPatterns: ['heap'], importanceScore: 7, estimatedMinutes: 40 },
  { title: 'Alien Dictionary', link: 'https://leetcode.com/problems/alien-dictionary/', difficulty: 'hard', primaryPattern: 'graphs', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 45 },
  { title: 'Cheapest Flights Within K Stops', link: 'https://leetcode.com/problems/cheapest-flights-within-k-stops/', difficulty: 'medium', primaryPattern: 'graphs', secondaryPatterns: ['dp'], importanceScore: 8, estimatedMinutes: 35 },

  // 1-D Dynamic Programming
  { title: 'Climbing Stairs', link: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'easy', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 15 },
  { title: 'Min Cost Climbing Stairs', link: 'https://leetcode.com/problems/min-cost-climbing-stairs/', difficulty: 'easy', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 15 },
  { title: 'House Robber', link: 'https://leetcode.com/problems/house-robber/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 20 },
  { title: 'House Robber II', link: 'https://leetcode.com/problems/house-robber-ii/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Longest Palindromic Substring', link: 'https://leetcode.com/problems/longest-palindromic-substring/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Palindromic Substrings', link: 'https://leetcode.com/problems/palindromic-substrings/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Decode Ways', link: 'https://leetcode.com/problems/decode-ways/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Coin Change', link: 'https://leetcode.com/problems/coin-change/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Maximum Product Subarray', link: 'https://leetcode.com/problems/maximum-product-subarray/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Word Break', link: 'https://leetcode.com/problems/word-break/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Longest Increasing Subsequence', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 30 },
  { title: 'Partition Equal Subset Sum', link: 'https://leetcode.com/problems/partition-equal-subset-sum/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 30 },

  // 2-D Dynamic Programming
  { title: 'Unique Paths', link: 'https://leetcode.com/problems/unique-paths/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Longest Common Subsequence', link: 'https://leetcode.com/problems/longest-common-subsequence/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 30 },
  { title: 'Best Time to Buy and Sell Stock with Cooldown', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Coin Change II', link: 'https://leetcode.com/problems/coin-change-ii/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 30 },
  { title: 'Target Sum', link: 'https://leetcode.com/problems/target-sum/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: ['backtracking'], importanceScore: 8, estimatedMinutes: 30 },
  { title: 'Interleaving String', link: 'https://leetcode.com/problems/interleaving-string/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 35 },
  { title: 'Longest Increasing Path in a Matrix', link: 'https://leetcode.com/problems/longest-increasing-path-in-a-matrix/', difficulty: 'hard', primaryPattern: 'dp', secondaryPatterns: ['graphs'], importanceScore: 8, estimatedMinutes: 40 },
  { title: 'Edit Distance', link: 'https://leetcode.com/problems/edit-distance/', difficulty: 'medium', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 35 },
  { title: 'Burst Balloons', link: 'https://leetcode.com/problems/burst-balloons/', difficulty: 'hard', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 50 },
  { title: 'Regular Expression Matching', link: 'https://leetcode.com/problems/regular-expression-matching/', difficulty: 'hard', primaryPattern: 'dp', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 50 },

  // Greedy
  { title: 'Maximum Subarray', link: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'medium', primaryPattern: 'greedy', secondaryPatterns: ['dp'], importanceScore: 10, estimatedMinutes: 20 },
  { title: 'Jump Game', link: 'https://leetcode.com/problems/jump-game/', difficulty: 'medium', primaryPattern: 'greedy', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 20 },
  { title: 'Jump Game II', link: 'https://leetcode.com/problems/jump-game-ii/', difficulty: 'medium', primaryPattern: 'greedy', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Gas Station', link: 'https://leetcode.com/problems/gas-station/', difficulty: 'medium', primaryPattern: 'greedy', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Hand of Straights', link: 'https://leetcode.com/problems/hand-of-straights/', difficulty: 'medium', primaryPattern: 'greedy', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 25 },
  { title: 'Merge Intervals', link: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'medium', primaryPattern: 'intervals', secondaryPatterns: [], importanceScore: 10, estimatedMinutes: 25 },
  { title: 'Insert Interval', link: 'https://leetcode.com/problems/insert-interval/', difficulty: 'medium', primaryPattern: 'intervals', secondaryPatterns: [], importanceScore: 9, estimatedMinutes: 25 },
  { title: 'Non Overlapping Intervals', link: 'https://leetcode.com/problems/non-overlapping-intervals/', difficulty: 'medium', primaryPattern: 'intervals', secondaryPatterns: ['greedy'], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Meeting Rooms', link: 'https://leetcode.com/problems/meeting-rooms/', difficulty: 'easy', primaryPattern: 'intervals', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 15 },
  { title: 'Meeting Rooms II', link: 'https://leetcode.com/problems/meeting-rooms-ii/', difficulty: 'medium', primaryPattern: 'intervals', secondaryPatterns: ['heap'], importanceScore: 9, estimatedMinutes: 25 },

  // Bit Manipulation
  { title: 'Single Number', link: 'https://leetcode.com/problems/single-number/', difficulty: 'easy', primaryPattern: 'bit_manipulation', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Number of 1 Bits', link: 'https://leetcode.com/problems/number-of-1-bits/', difficulty: 'easy', primaryPattern: 'bit_manipulation', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 10 },
  { title: 'Counting Bits', link: 'https://leetcode.com/problems/counting-bits/', difficulty: 'easy', primaryPattern: 'bit_manipulation', secondaryPatterns: ['dp'], importanceScore: 7, estimatedMinutes: 15 },
  { title: 'Reverse Bits', link: 'https://leetcode.com/problems/reverse-bits/', difficulty: 'easy', primaryPattern: 'bit_manipulation', secondaryPatterns: [], importanceScore: 6, estimatedMinutes: 15 },
  { title: 'Missing Number', link: 'https://leetcode.com/problems/missing-number/', difficulty: 'easy', primaryPattern: 'bit_manipulation', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 10 },
  { title: 'Sum of Two Integers', link: 'https://leetcode.com/problems/sum-of-two-integers/', difficulty: 'medium', primaryPattern: 'bit_manipulation', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Reverse Integer', link: 'https://leetcode.com/problems/reverse-integer/', difficulty: 'medium', primaryPattern: 'bit_manipulation', secondaryPatterns: [], importanceScore: 6, estimatedMinutes: 15 },

  // Math
  { title: 'Rotate Image', link: 'https://leetcode.com/problems/rotate-image/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 20 },
  { title: 'Spiral Matrix', link: 'https://leetcode.com/problems/spiral-matrix/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 8, estimatedMinutes: 25 },
  { title: 'Set Matrix Zeroes', link: 'https://leetcode.com/problems/set-matrix-zeroes/', difficulty: 'medium', primaryPattern: 'arrays_hashing', secondaryPatterns: [], importanceScore: 7, estimatedMinutes: 20 },
]

async function seed() {
  // Dynamic import ensures client.ts reads DATABASE_URL after dotenv has run
  const { db } = await import('./client')
  const { questions } = await import('./schema')

  console.log(`Seeding ${seedQuestions.length} questions...`)
  await db.insert(questions).values(seedQuestions).onConflictDoNothing()
  console.log('Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})

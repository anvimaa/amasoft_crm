<script lang="ts">
	interface Props {
		name: 
			| 'dashboard' 
			| 'kanban' 
			| 'table' 
			| 'map' 
			| 'search' 
			| 'filter' 
			| 'plus' 
			| 'phone' 
			| 'whatsapp' 
			| 'globe' 
			| 'location' 
			| 'building' 
			| 'mail' 
			| 'user' 
			| 'calendar' 
			| 'clock' 
			| 'money' 
			| 'chart' 
			| 'check' 
			| 'close' 
			| 'trash' 
			| 'edit' 
			| 'external' 
			| 'download' 
			| 'upload'
			| 'file'
			| 'refresh' 
			| 'sparkles' 
			| 'fire' 
			| 'tag' 
			| 'send'
			| 'chevron-down'
			| 'chevron-right'
			| 'chevron-left'
			| 'chevrons-left'
			| 'chevrons-right'
			| 'arrow-right';
		class?: string;
		size?: number;
	}

	let { name, class: className = 'w-5 h-5', size }: Props = $props();
</script>

<svg 
	xmlns="http://www.w3.org/2000/svg" 
	viewBox="0 0 24 24" 
	fill="none" 
	stroke="currentColor" 
	stroke-width="2" 
	stroke-linecap="round" 
	stroke-linejoin="round" 
	class={className}
	style={size ? `width: ${size}px; height: ${size}px;` : undefined}
>
	{#if name === 'dashboard'}
		<rect width="7" height="9" x="3" y="3" rx="1" />
		<rect width="7" height="5" x="14" y="3" rx="1" />
		<rect width="7" height="9" x="14" y="12" rx="1" />
		<rect width="7" height="5" x="3" y="16" rx="1" />
	{:else if name === 'kanban'}
		<path d="M6 5v11" /><path d="M12 5v6" /><path d="M18 5v14" />
	{:else if name === 'table'}
		<path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" />
	{:else if name === 'map'}
		<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
		<path d="M15 5.764v15" /><path d="M9 3.236v15" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
	{:else if name === 'filter'}
		<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
	{:else if name === 'plus'}
		<path d="M5 12h14" /><path d="M12 5v14" />
	{:else if name === 'phone'}
		<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
	{:else if name === 'whatsapp'}
		<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
		<path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
	{:else if name === 'globe'}
		<circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
	{:else if name === 'location'}
		<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />
	{:else if name === 'building'}
		<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
	{:else if name === 'mail'}
		<rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
	{:else if name === 'user'}
		<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
	{:else if name === 'calendar'}
		<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
	{:else if name === 'clock'}
		<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
	{:else if name === 'money'}
		<rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" />
	{:else if name === 'chart'}
		<path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
	{:else if name === 'check'}
		<polyline points="20 6 9 17 4 12" />
	{:else if name === 'close'}
		<path d="M18 6 6 18" /><path d="m6 6 12 12" />
	{:else if name === 'trash'}
		<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
	{:else if name === 'edit'}
		<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
	{:else if name === 'external'}
		<path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
	{:else if name === 'download'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
	{:else if name === 'upload'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
	{:else if name === 'file'}
		<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
	{:else if name === 'refresh'}
		<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" />
	{:else if name === 'sparkles'}
		<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
	{:else if name === 'fire'}
		<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
	{:else if name === 'tag'}
		<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
	{:else if name === 'send'}
		<path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
	{:else if name === 'chevron-down'}
		<polyline points="6 9 12 15 18 9" />
	{:else if name === 'chevron-right'}
		<polyline points="9 18 15 12 9 6" />
	{:else if name === 'chevron-left'}
		<polyline points="15 18 9 12 15 6" />
	{:else if name === 'chevrons-left'}
		<polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
	{:else if name === 'chevrons-right'}
		<polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
	{:else if name === 'arrow-right'}
		<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
	{/if}
</svg>

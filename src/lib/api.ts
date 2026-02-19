const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchEquipments() {
    const res = await fetch(`${API_URL}?action=getEquipments`);
    if (!res.ok) throw new Error('Failed to fetch equipments');
    return res.json();
}

export async function fetchEntries() {
    const res = await fetch(`${API_URL}?action=getEntries`);
    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
}

export async function addEquipment(data: any) {
    const res = await fetch(API_URL!, {
        method: 'POST',
        body: JSON.stringify({ action: 'addEquipment', ...data }),
    });
    if (!res.ok) throw new Error('Failed to add equipment');
    return res.json();
}

export async function addEntry(data: any) {
    const res = await fetch(API_URL!, {
        method: 'POST',
        body: JSON.stringify({ action: 'addEntry', ...data }),
    });
    if (!res.ok) throw new Error('Failed to add entry');
    return res.json();
}

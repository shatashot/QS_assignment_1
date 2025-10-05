const token = "pat";
const projectId = "prj_id"; // from Asana project URL

async function fetchTasks() {
  const res = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}/tasks?opt_fields=name,permalink_url,parent`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data;
}

async function updateParentDescriptions() {
  const tasks = await fetchTasks();
  
  // Group children by parent
  const parentMap = {};
  tasks.forEach(task => {
    if (task.parent) {
      if (!parentMap[task.parent.gid]) parentMap[task.parent.gid] = [];
      parentMap[task.parent.gid].push(task);
    }
  });

  // Update parent descriptions
  for (const parentId of Object.keys(parentMap)) {
    const children = parentMap[parentId];
    const links = children.map(c => `- [${c.name}](${c.permalink_url})`).join("\n");

    const parentRes = await fetch(`https://app.asana.com/api/1.0/tasks/${parentId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const parent = (await parentRes.json()).data;
    const newNotes = (parent.notes || "") + "\n\n### Child Tasks:\n" + links;

    await fetch(`https://app.asana.com/api/1.0/tasks/${parentId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: { notes: newNotes } })
    });

    console.log(`Updated parent: ${parent.name}`);
  }
}

updateParentDescriptions();

const createNewCourse = async ()=>{
    try {
        const response = await fetch('http://localhost:8080/api/course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: "New Course",
                description: "Course Description",
                duration: 30,
                price: 100
            })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Course created successfully:', data);
    } catch (error) {
        console.error('Error creating course:', error);
    }

}
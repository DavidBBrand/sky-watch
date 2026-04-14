# 1. Use a slim version of Python 3.12 for a smaller, faster image
FROM python:3.12-slim

# 2. Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing .pyc files to disk
# PYTHONUNBUFFERED: Ensures console logs appear in real-time (vital for debugging)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Install system-level dependencies
# build-essential is often needed for math libraries (NumPy, etc.) that compile C code
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 5. Copy and install Python dependencies
# We copy requirements.txt first to take advantage of Docker's caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of your project files
# This includes main.py, redis_client.py, and your de421.bsp ephemeris file
COPY . .

# 7. Tell Docker that the container listens on port 8000
EXPOSE 8000

# 8. Start the FastAPI server using uvicorn
# --host 0.0.0.0 is MANDATORY inside Docker to allow external connections
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
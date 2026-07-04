# train_yolo.py

from ultralytics import YOLO


def main():
    model = YOLO("yolov8n.pt")

    model.train(
        data="resume_dataset/data.yaml",
        epochs=100,
        imgsz=640,
        batch=8,
        patience=20,
        project="runs",
        name="resume_sections"
    )


if __name__ == "__main__":
    main()
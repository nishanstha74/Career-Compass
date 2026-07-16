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

    # ── Evaluate on the validation set after training ──
    # Runs inference on data.yaml's "val" split and computes standard
    # detection metrics: mAP50, mAP50-95, per-class precision/recall.
    metrics = model.val()

    print("\n=== Validation Metrics ===")
    print(f"  mAP50 (IoU=0.5):        {metrics.box.map50:.4f}")
    print(f"  mAP50-95 (IoU=0.5:0.95): {metrics.box.map:.4f}")
    print(f"  Mean Precision:          {metrics.box.mp:.4f}")
    print(f"  Mean Recall:             {metrics.box.mr:.4f}")

    # Per-class breakdown — useful to see if one section type (e.g.
    # "skills" vs "education") is dragging down the overall score
    print("\n=== Per-Class mAP50-95 ===")
    class_names = model.names
    for i, ap in enumerate(metrics.box.maps):
        print(f"  {class_names[i]:20s} {ap:.4f}")


if __name__ == "__main__":
    main()
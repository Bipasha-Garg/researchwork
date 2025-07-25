from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
import pandas as pd
from datetime import datetime
from variance import process_file
# from gini import process_file

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(
    app,
    resources={
        r"/upload": {"origins": ["http://localhost:3000"]},
        r"/uploads/*": {"origins": ["http://localhost:3000"]},
    },
)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def process_file_and_convert_to_json(file_path, json_folder, filename_prefix="data"):
    try:
        df = pd.read_csv(file_path)
        if df.shape[1] < 2:
            raise ValueError("Insufficient columns in the CSV file")

        # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = "processed.json"
        cluster_file = "classification.json"
        parallel_file = "parallel.json"
        json_folder, json_filename, labels_file, cluster_file, parallel_file = (
            process_file(
                file_path, json_folder, json_filename, cluster_file, parallel_file
            )
        )

        return {
            "json_folder": json_folder,
            "json_filename": json_filename,
            "labels_file": labels_file,
            "cluster_file": cluster_file,
            "parallel_file": parallel_file,
        }

    except Exception as e:
        logging.error(f"Error processing file: {e}")
        raise Exception(f"Error processing file: {str(e)}")


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{file.filename}"
        upload_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(upload_path)
        logging.debug(f"File uploaded: {upload_path}")

        # Process file and get all results
        result = process_file_and_convert_to_json(
            upload_path, app.config["UPLOAD_FOLDER"], "data"
        )

        return (
            jsonify(
                {
                    "message": "File uploaded and processed successfully",
                    "filename": filename,
                    "json_folder": result["json_folder"],
                    "json_filename": result["json_filename"],
                    "labels_file": result["labels_file"],
                    "cluster_file": result["cluster_file"],
                    "parallel_file": result["parallel_file"],
                    "paths": {
                        "uploaded_file": upload_path,
                        "json": os.path.join(
                            result["json_folder"], result["json_filename"]
                        ),
                        "labels": result["labels_file"],
                        "classification": result["cluster_file"],
                        "parallel": result["parallel_file"],
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logging.error(f"Error: {e}")
        return jsonify({"error": f"Error: {str(e)}"}), 500


@app.route("/uploads/<filename>")
def serve_file(filename):
    try:
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
            return jsonify({"error": "File not found"}), 404

        logging.debug(f"Serving file: {file_path}")
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    except Exception as e:
        logging.error(f"Error serving file: {e}")
        return jsonify({"error": "Error serving file"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)


# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# import os
# import logging
# import pandas as pd
# from datetime import datetime
# from variance import process_file

# logging.basicConfig(level=logging.DEBUG)

# app = Flask(__name__)
# CORS(
#     app,
#     resources={
#         r"/process": {"origins": ["http://localhost:3000"]},
#         r"/uploads/*": {"origins": ["http://localhost:3000"]},
#     },
# )

# UPLOAD_FOLDER = "uploads"
# app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# # Define the fixed dataset path
# DATASET_PATH = os.path.join("my-react-app", "public", "128_20_4.csv")

# def process_file_and_convert_to_json(file_path, json_folder, filename_prefix="data"):
#     try:
#         df = pd.read_csv(file_path)
#         if df.shape[1] < 2:
#             raise ValueError("Insufficient columns in the CSV file")

#         json_filename = "processed.json"
#         cluster_file = "classification.json"
#         parallel_file = "parallel.json"
#         json_folder, json_filename, labels_file, cluster_file, parallel_file = (
#             process_file(
#                 file_path, json_folder, json_filename, cluster_file, parallel_file
#             )
#         )

#         return {
#             "json_folder": json_folder,
#             "json_filename": json_filename,
#             "labels_file": labels_file,
#             "cluster_file": cluster_file,
#             "parallel_file": parallel_file,
#         }

#     except Exception as e:
#         logging.error(f"Error processing file: {e}")
#         raise Exception(f"Error processing file: {str(e)}")

# @app.route("/process", methods=["GET"])
# def process_default_file():
#     try:
#         if not os.path.exists(DATASET_PATH):
#             return jsonify({"error": f"Default dataset not found at {DATASET_PATH}"}), 404

#         logging.debug(f"Processing default file: {DATASET_PATH}")

#         # Copy the default dataset to the uploads folder
#         filename = "dataset.csv"
#         upload_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)

#         # Read and save to ensure we have a copy in the uploads folder
#         df = pd.read_csv(DATASET_PATH)
#         df.to_csv(upload_path, index=False)

#         # Process file and get all results
#         result = process_file_and_convert_to_json(
#             upload_path, app.config["UPLOAD_FOLDER"], "data"
#         )

#         return (
#             jsonify(
#                 {
#                     "message": "Default file processed successfully",
#                     "filename": filename,
#                     "json_folder": result["json_folder"],
#                     "json_filename": result["json_filename"],
#                     "labels_file": result["labels_file"],
#                     "cluster_file": result["cluster_file"],
#                     "parallel_file": result["parallel_file"],
#                     "paths": {
#                         "processed_file": upload_path,
#                         "json": os.path.join(
#                             result["json_folder"], result["json_filename"]
#                         ),
#                         "labels": result["labels_file"],
#                         "classification": result["cluster_file"],
#                         "parallel": result["parallel_file"],
#                     },
#                 }
#             ),
#             200,
#         )

#     except Exception as e:
#         logging.error(f"Error: {e}")
#         return jsonify({"error": f"Error: {str(e)}"}), 500

# @app.route("/uploads/<filename>")
# def serve_file(filename):
#     try:
#         file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
#         if not os.path.exists(file_path):
#             logging.error(f"File not found: {file_path}")
#             return jsonify({"error": "File not found"}), 404

#         logging.debug(f"Serving file: {file_path}")
#         return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
#     except Exception as e:
#         logging.error(f"Error serving file: {e}")
#         return jsonify({"error": "Error serving file"}), 500

# if __name__ == "__main__":
#     app.run(debug=True, host="0.0.0.0", port=5000)

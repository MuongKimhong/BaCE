<template>
  <v-dialog v-model="dialogVisible" persistent width="450" height="150">
    <v-card width="450" height="150" class="px-3 py-4" color="#252525">
      <v-card-text>
        <v-text-field
          v-model="fileName"
          density="comfortable"
          label="File Name"
          variant="solo"
          hide-details
          single-line
          color="white"
          bg-color="#616161"
        ></v-text-field>
      </v-card-text>
      <div class="text-right px-6">
        <v-btn
          class="text-capitalize mr-5"
          density="comfortable"
          color="#616161"
          @click="dialogVisible = false"
        >
          Cancel
        </v-btn>
        <v-btn
          class="text-capitalize"
          density="comfortable"
          color="#006064"
          @click="createBtnOnClick"
        >
          Create
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { open } from "@tauri-apps/plugin-dialog";

export default {
  name: "NewFileDialog",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["update:modelValue", "create", "newFileCreated"],
  data() {
    return {
      fileName: "",
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },
  methods: {
    createBtnOnClick: async function () {
      if (this.fileName.trim() !== "") {
        let dirPath = await open({
          directory: true,
          multiple: false,
          title: "Select a directory to save your file",
        });

        if (dirPath) {
          let filePath = `${dirPath}/${this.fileName}`;
          await this.$writeTextFile(filePath, "");
          this.fileName = "";
          this.dialogVisible = false;

          this.$emit("newFileCreated", filePath);
        }
      }
    },
  },
};
</script>

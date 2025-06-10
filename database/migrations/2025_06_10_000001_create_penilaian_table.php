<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('penilaian', function (Blueprint $table) {
            $table->id();
            $table->string('project_name');
            $table->string('penguji')->nullable();
            $table->text('catatan')->nullable();
            $table->float('nilai_final')->nullable();
            $table->string('predikat')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('penilaian');
    }
};

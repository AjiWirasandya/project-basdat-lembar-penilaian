<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penilaian_id')->constrained('penilaian')->onDelete('cascade');
            $table->string('nama_chapter');
            $table->float('bobot')->default(100);
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};
